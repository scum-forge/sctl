import { program } from '@commander-js/extra-typings';
import { DatabaseManager } from './classes/database-manager.ts';
import { Logger } from './classes/log-manager.ts';
import { getVehicleOwner } from './commands/vehicle-owner.ts';
import type { Callback } from './utils/types.ts';
import { parseIntArg } from './utils/utils.ts';

async function mainWrapper(cb: Callback<Promise<void>>)
{
	const rootOpts = program.opts() as Record<'verbose', string | number>;
	const verbosity = rootOpts.verbose as number; // already parsed in parseIntArg

	if (verbosity === 1) Logger.level = 'debug';
	else if (verbosity >= 2) Logger.level = 'trace';

	try
	{
		Logger.debug('Connecting to the database...');
		await DatabaseManager.init();
		Logger.debug('Connected');

		await cb();
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
	.option('-v, --verbose', 'display extended logging information', ((dummy, previous) => previous + 1), 0)
	.version('1.0.0');

program
	.command('get-vehicle-owner')
	.description('get information about the owner of a vehicle')
	.argument('<vehicleId>', 'the id of vehicle to query', parseIntArg)
	.action(async (vehicleId) =>
	{
		await mainWrapper(async () =>
		{
			const ret = await getVehicleOwner(vehicleId);
			if (ret.isOk())
			{
				Logger.info(`Vehicle #${vehicleId} - Owner Information:`);
				console.table(ret.value);
			}
			else Logger.error(ret.error);
		});
	});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
program.parseAsync(process.argv);
