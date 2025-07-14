import { err, ok } from 'neverthrow';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';
import type { ExtractedUserId } from '../utils/utils.ts';

async function getAllUserVehicles(id: ExtractedUserId)
{
	const profile = await DatabaseManager.findProfile(id, {
		select: { id: true },
	});

	if (!profile)
	{
		return err('User not found');
	}

	const ownedEntities = await DatabaseManager.item_entity.findMany({
		where: {
			xml: {
				contains: `_owningUserProfileId="${profile.id}"`,
			},
			entity: {
				reason: 'AVehicleBase::BeginPlay',
			},
		},
		select: {
			entity_id: true,
			entity: {
				select: {
					class: true,
					owning_entity_id: true,
				},
			},
		},
	});

	if (ownedEntities.length === 0)
	{
		return err('User has no owned vehicles');
	}

	const res = ownedEntities.map((e) => ({
		vehicleId: e.entity.owning_entity_id,
		class: e.entity.class.replace('_Item_Container_ES', ''),
		// containerId: e.entity_id,
	}));

	return ok(res);
}

export async function getAllUserVehiclesCommand(id: ExtractedUserId)
{
	const ret = await getAllUserVehicles(id);
	if (ret.isOk())
	{
		console.table(ret.value);
	}
	else Logger.error(ret.error);
}
