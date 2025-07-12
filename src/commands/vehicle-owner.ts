import { err, ok } from 'neverthrow';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';

function getUserId(xml: string)
{
	/**
	 * It would be better to parse the XML with an XML parser, but that
	 * requires a third-party dependency.
	 * For the sake of simplicity, I use regex instead.
	 * (It should be okay for this use case)
	 */
	const match = /_owningUserProfileId="(\d+)"/.exec(xml);
	if (!match)
	{
		throw new Error('Could not find _owningUserProfileId in the XML.');
	}

	const ret = Number(match[1]);
	return Number.isNaN(ret) ? 0 : ret;

	// Requires a third party dependency: fast-xml-parser
	// import { XMLParser } from 'fast-xml-parser';
	/* interface ItemXml
	{
		Item: {
			'@_owningUserProfileId': number;
		};
	}

	const parser = new XMLParser({
		ignoreAttributes: false,
		parseAttributeValue: true,
		attributeNamePrefix: '@',
		trimValues: true,
		ignoreDeclaration: true,
	});

	const parsed = parser.parse(xml) as ItemXml;
	return parsed.Item['@_owningUserProfileId']; */
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

export async function getVehicleOwnerWrapper(vehicleId: number)
{
	const ret = await getVehicleOwner(vehicleId);
	if (ret.isOk())
	{
		Logger.info(`Vehicle #${vehicleId} - Owner Information:`);
		console.table(ret.value);
	}
	else Logger.error(ret.error);
}
