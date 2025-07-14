import { err, ok } from 'neverthrow';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';

export function getUserId(xml: string)
{
	const match = /_owningUserProfileId="(\d+)"/.exec(xml);
	if (!match)
	{
		throw new Error('Could not find _owningUserProfileId in the XML.');
	}

	const ret = Number(match[1]);
	return Number.isNaN(ret) ? 0 : ret;
}

async function getVehicleOwner(vehicleId: number)
{
	const vehEntity = await DatabaseManager.vehicle_entity.findUnique({
		where: { entity_id: vehicleId },
		select: { item_container_entity_id: true },
	});

	const xml = !vehEntity?.item_container_entity_id
		? null
		: (await DatabaseManager.item_entity.findUnique({
			where: { entity_id: vehEntity.item_container_entity_id },
			select: { xml: true },
		}))?.xml;

	if (!xml)
	{
		return err(`No XML data found for vehicle #${vehicleId}.`);
	}

	const userId = getUserId(xml);

	if (userId === 0)
	{
		return err(`Vehicle #${vehicleId} has no owner.`);
	}

	const user = await DatabaseManager.user_profile.findUnique({
		where: { id: userId },
		select: { id: true, user_id: true, name: true },
	});

	if (!user)
	{
		return err(`Owner with userProfileId ${userId} not found in user_profile table.`);
	}

	return ok(user);
}

export async function getVehicleOwnerCommand(vehicleId: number)
{
	const ret = await getVehicleOwner(vehicleId);
	if (ret.isOk())
	{
		Logger.info(`Vehicle #${vehicleId} - Owner Information:`);
		console.table(ret.value);
	}
	else Logger.error(ret.error);
}
