import { program } from '@commander-js/extra-typings';
import i18next from 'i18next';
import { err, ok } from 'neverthrow';
import type { RootOptions } from '../@types/types.ts';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';
import { parseBlob } from '../utils/blob-parser.ts';
import type { ExtractedUserId } from '../utils/utils.ts';

// Class ConZ.PrisonerBodySimulationSave
export const keys = [
	'IsDead',
	'BaseStrength',
	'BaseConstitution',
	'BaseDexterity',
	'BaseIntelligence',
	'InitialAge',
	'LifeTimeSinceInitialization',
	'LifeTimeSinceSpawn',
	'TimeOfDeath',
	'TimeOfRevive',
	'TimeOfComa',
	'TimeOfComaWakeUp',
	'Stamina',
	'AccumulatedFatigue',
	'HeartRate',
	'BreathingRate',
	'OxygenSaturation',
	'BodyTemperature',
	'PhoenixTearsAmount',
];

export async function getBodySimulation(id: ExtractedUserId, properties?: string[])
{
	const profile = await DatabaseManager.findProfile(id, {
		select: {
			name: true,
			prisoner_user_profile_prisoner_idToprisoner: {
				select: {
					body_simulation: true,
				},
			},
		},
	});

	if (!profile) return err(i18next.t('errors.userNotFound'));
	if (!profile.prisoner_user_profile_prisoner_idToprisoner?.body_simulation) return err(i18next.t('commands.body-simulation.notFound', { userId: id }));

	const parsed = parseBlob(Buffer.from(profile.prisoner_user_profile_prisoner_idToprisoner.body_simulation), properties ?? keys);

	if (parsed.isErr())
	{
		return err(parsed.error);
	}

	return ok({
		name: profile.name,
		bodySimulation: parsed.value.result,
		warnings: parsed.value.warnings,
	});
}

export async function getBodySimulationCommand(id: ExtractedUserId, properties?: string[])
{
	const ret = await getBodySimulation(id, properties);
	if (ret.isOk())
	{
		const keysLen = Object.keys(ret.value.bodySimulation).length;
		if (keysLen > 0)
		{
			Logger.info(i18next.t('commands.body-simulation.ok', { user: ret.value.name }));
			console.table(ret.value.bodySimulation);
		}
		else Logger.info(i18next.t('commands.body-simulation.noLen'));

		if (ret.value.warnings.length > 0 && (properties !== undefined || (program.opts() as RootOptions).verbose > 0))
		{
			Logger.warn(i18next.t('errors.oneOrMoreWarnings'));
			ret.value.warnings.forEach((w) => Logger.warn(w));
		}
	}
	else Logger.error(ret.error);
}
