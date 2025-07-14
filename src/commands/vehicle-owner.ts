import i18next from 'i18next';
import { err, ok } from 'neverthrow';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';

export function getUserId(xml: string)
{
	const match = /_owningUserProfileId="(\d+)"/.exec(xml);
	if (!match)
	{
		return err(i18next.t('commands.vehicle-owner.profileIdNotFound'));
	}

	const ret = Number(match[1]);
	return !Number.isNaN(ret)
		? ok(ret)
		: err(i18next.t('commands.vehicle-owner.profileIdNotValid'));
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
		return err(i18next.t('commands.vehicle-owner.noXML', { vehicleId }));
	}

	const userId = getUserId(xml);
	if (userId.isErr())
	{
		return err(userId.error);
	}

	if (userId.value === 0)
	{
		return err(i18next.t('commands.vehicle-owner.noOwner', { vehicleId }));
	}

	const user = await DatabaseManager.user_profile.findUnique({
		where: { id: userId.value },
		select: { id: true, user_id: true, name: true },
	});

	if (!user)
	{
		return err(i18next.t('commands.vehicle-owner.ownerNotFound', { userId: userId.value }));
	}

	return ok(user);
}

export async function getVehicleOwnerCommand(vehicleId: number)
{
	const ret = await getVehicleOwner(vehicleId);
	if (ret.isOk())
	{
		Logger.info(i18next.t('commands.vehicle-owner.ok', { vehicleId }));
		console.table(ret.value);
	}
	else Logger.error(ret.error);
}
