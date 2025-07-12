import { Command, Option, program } from '@commander-js/extra-typings';
import { join } from 'node:path';
import { DatabaseManager } from './classes/database-manager.ts';
import { Logger } from './classes/log-manager.ts';
import { getBodySimulationWrapper } from './commands/body-simulation.ts';
import { getUserInfoWrapper } from './commands/user-info.ts';
import { getVehicleOwnerWrapper } from './commands/vehicle-owner.ts';
import type { Callback } from './utils/types.ts';
import { parseIntArg } from './utils/utils.ts';

interface RootOptions
{
	db: string | undefined;
	verbose: number;
}

async function mainWrapper<T extends unknown[], V>(cb: Callback<T, V>, ...opts: T)
{
	const rootOpts = program.opts() as RootOptions;

	if (rootOpts.verbose === 1) Logger.level = 'debug';
	else if (rootOpts.verbose >= 2) Logger.level = 'trace';

	Logger.debug(`DATABASE_URL: ${process.env.DATABASE_URL}`);

	if (rootOpts.db && rootOpts.db !== process.env.DATABASE_URL)
	{
		const newPath = `file:${join('..', rootOpts.db)}`;
		Logger.debug(`Setting new DATABASE_URL env to ${newPath}`);
		process.env.DATABASE_URL = newPath;
	}

	try
	{
		Logger.debug('Connecting to the database...');
		await DatabaseManager.init();
		Logger.debug('Connected');

		await cb(...opts);
	}
	catch (e)
	{
		Logger.error(e instanceof Error ? e.message : e);
	}
	finally
	{
		Logger.debug('Disconnecting from the database...');
		await DatabaseManager.disconnect();
		Logger.debug('Disconnected');
	}
}

program
	.name('dbhelper')
	.description('database helper tools for SCUM')
	.option('--db <path>', 'a custom path to the SCUM.db file (overrides DATABASE_URL)', process.env.DATABASE_URL)
	.option('-v, --verbose', 'display extended logging information', ((dummy, previous) => previous + 1), 0)
	.version('1.0.0');

const getCommand = new Command('get')
	.description('fetch info from the database');

getCommand
	.command('vehicle-owner')
	.description('get information about the owner of a vehicle')
	.argument('<vehicleId>', 'the id of vehicle to query', parseIntArg)
	.action(async (vehicleId) => await mainWrapper(getVehicleOwnerWrapper, vehicleId));

getCommand
	.command('body-simulation')
	.description('get a prisoner\'s body simulation data')
	.argument('<id>', 'the steam id of the prisoner to query')
	.action(async (id) => await mainWrapper(getBodySimulationWrapper, id));

getCommand
	.command('user-info')
	.description('get relevant user info')
	.argument('<id>', 'user profile id or steam id 64')
	.addOption(
		new Option('-t, --type <type>', 'parsed id type')
			.choices(['profile', 'steam'])
			.default('steam')
	)
	.action(async (id, options) => await mainWrapper(getUserInfoWrapper, id, options.type));

// register commands
program.addCommand(getCommand);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
program.parseAsync(process.argv);
