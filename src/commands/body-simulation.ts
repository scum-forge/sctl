import { program } from '@commander-js/extra-typings';
import { err, ok } from 'neverthrow';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';
import { parseBlob } from '../utils/blob-parser.ts';
import type { RootOptions } from '../utils/types.ts';
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

	if (!profile) return err('User not found');
	if (!profile.prisoner_user_profile_prisoner_idToprisoner?.body_simulation) return err('Unable to find body simulation data for the specified ID.');

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
			Logger.info(`Body simulation data for ${ret.value.name}:`);
			console.table(ret.value.bodySimulation);
		}
		else Logger.info('No body simulation data returned');

		if (ret.value.warnings.length > 0 && (properties !== undefined || (program.opts() as RootOptions).verbose > 0))
		{
			Logger.warn('The execution resulted in one or more warnings');
			ret.value.warnings.forEach((w) => Logger.warn(w));
		}
	}
	else Logger.error(ret.error);
}
