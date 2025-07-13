import { Command, Option, program } from '@commander-js/extra-typings';
import pkgJson from '../package.json' with { type: 'json' };
import { getBodySimulationWrapper } from './commands/body-simulation.ts';
import { getUserInfoWrapper } from './commands/user-info.ts';
import { getVehicleOwnerWrapper } from './commands/vehicle-owner.ts';
import { actionWrapper, parseIntArg } from './utils/utils.ts';

program
	.name('sctl')
	.description('cli/api tools to help you manage a SCUM dedicated server')
	.option('--db <path>', 'a custom path to the SCUM.db file (overrides DATABASE_URL)', process.env.DATABASE_URL)
	.option('-v, --verbose', 'display extended logging information', ((_, previous) => previous + 1), 0)
	.version(pkgJson.version);

const getCommand = new Command('get')
	.description('fetch info from the database');

getCommand
	.command('vehicle-owner')
	.description('get information about the owner of a vehicle')
	.argument('<vehicleId>', 'the id of vehicle to query', parseIntArg)
	.action(async (vehicleId) => await actionWrapper(getVehicleOwnerWrapper, vehicleId));

getCommand
	.command('body-simulation')
	.description('get a prisoner\'s body simulation data')
	.argument('<id>', 'the steam id of the prisoner to query')
	.option('-p, --props <names...>', 'find custom properties by name')
	.action(async (id, options) => await actionWrapper(getBodySimulationWrapper, id, options.props));

getCommand
	.command('user-info')
	.description('get relevant user info')
	.argument('<id>', 'user profile id or steam id 64')
	.addOption(
		new Option('-t, --type <type>', 'parsed id type')
			.choices(['profile', 'steam'])
			.default('steam')
	)
	.action(async (id, options) => await actionWrapper(getUserInfoWrapper, id, options.type));

// register commands
program.addCommand(getCommand);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
program.parseAsync(process.argv);
