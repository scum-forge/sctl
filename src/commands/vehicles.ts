import { Command } from '@commander-js/extra-typings';
import i18next from 'i18next';
import { err, ok } from 'neverthrow';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';
import { actionWrapper, parseUserId, type ExtractedUserId } from '../utils/utils.ts';

async function getAllUserVehicles(id: ExtractedUserId)
{
	const profile = await DatabaseManager.findProfile(id, {
		select: {
			id: true,
			name: true,
		},
	});

	if (!profile)
	{
		return err(i18next.t('errors.userNotFound'));
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
		return err(i18next.t('commands.vehicles.noOwnedVehicles'));
	}

	const vehicles = ownedEntities.map((e) => ({
		vehicleId: e.entity.owning_entity_id,
		class: e.entity.class.replace('_Item_Container_ES', ''),
		// containerId: e.entity_id,
	}));

	return ok({
		name: profile.name,
		vehicles,
	});
}

export const getAllUserVehiclesCommand = () => new Command()
	.name('vehicles')
	.description(i18next.t('program.commands.get.commands.vehicles.description'))
	.addHelpText('after', i18next.t('program.commands.get.idHelp'))
	.argument('<id>', i18next.t('program.commands.get.commands.vehicles.id'), parseUserId)
	.action(async (id) => await actionWrapper(async () =>
	{
		const ret = await getAllUserVehicles(id);
		if (ret.isOk())
		{
			Logger.info(i18next.t('commands.vehicles.ok', { name: ret.value.name, count: ret.value.vehicles.length }));
			console.table(ret.value.vehicles);
		}
		else Logger.error(ret.error);
	}));
