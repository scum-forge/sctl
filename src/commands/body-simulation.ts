import { err, ok } from 'neverthrow';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';
import { parseBlob } from '../utils/blob-parser.ts';

// Class ConZ.PrisonerBodySimulationSave
const keys = [
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

async function getBodySimulation(id: string)
{
	const profile = await DatabaseManager.user_profile.findFirst({
		where: {
			user_id: id,
		},
		select: {
			name: true,
			prisoner_user_profile_prisoner_idToprisoner: {
				select: {
					body_simulation: true,
				},
			},
		},
	});

	if (!profile?.prisoner_user_profile_prisoner_idToprisoner?.body_simulation) return err('Unable to find body simulation data for the specified ID.');

	const parsed = parseBlob(Buffer.from(profile.prisoner_user_profile_prisoner_idToprisoner.body_simulation), keys);

	if (parsed.isErr())
	{
		return err(parsed.error);
	}

	return ok({
		name: profile.name,
		bodySimulation: parsed.value.result,
	});
}

export async function getBodySimulationWrapper(id: string)
{
	const ret = await getBodySimulation(id);
	if (ret.isOk())
	{
		Logger.info(`Body simulation data for ${ret.value.name}:`);
		console.table(ret.value.bodySimulation);
	}
	else Logger.error(ret.error);
}
