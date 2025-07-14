import { Command, program } from '@commander-js/extra-typings';
import pkgJson from '../package.json' with { type: 'json' };
import { getBodySimulationCommand } from './commands/body-simulation.ts';
import { getUserInfoCommand } from './commands/user-info.ts';
import { getVehicleOwnerCommand } from './commands/vehicle-owner.ts';
import { getAllUserVehiclesCommand } from './commands/vehicles.ts';
import { actionWrapper, parseIntArg, parseUserId } from './utils/utils.ts';

program
	.name('sctl')
	.description('cli/api tools to help you manage a SCUM dedicated server')
	.option('--db <path>', 'a custom path to the SCUM.db file (overrides DATABASE_URL)', process.env.DATABASE_URL)
	.option('-v, --verbose', 'display extended logging information', ((_, previous) => previous + 1), 0)
	.version(pkgJson.version);

const idHelp = `
Note:
  "id" expects the following format: prefix:id
    - steam prefix: steam, sid, s (e.g. sid:123)
    - profile prefix: profile, uid, p (e.g. pid:123)
    - no prefix: fallback to steamid (e.g. 123)
`;

const getCommand = new Command('get')
	.description('fetch info from the database');

getCommand
	.command('vehicle-owner')
	.description('get information about the owner of a vehicle')
	.argument('<vehicleId>', 'the id of vehicle to query', parseIntArg)
	.action(async (vehicleId) => await actionWrapper(getVehicleOwnerCommand, vehicleId));

getCommand
	.command('vehicles')
	.description('get all vehicles owned by an user')
	.addHelpText('after', idHelp)
	.argument('<id>', 'id of the user to query', parseUserId)
	.action(async (id) => await actionWrapper(getAllUserVehiclesCommand, id as string));

getCommand
	.command('body-simulation')
	.description('get a prisoner\'s body simulation data')
	.addHelpText('after', idHelp)
	.argument('<id>', 'id of the user to query', parseUserId)
	.option('-p, --props <names...>', 'find custom properties by name')
	.action(async (id, options) => await actionWrapper(getBodySimulationCommand, id as string, options.props));

getCommand
	.command('user-info')
	.description('get relevant user info')
	.addHelpText('after', idHelp)
	.argument('<id>', 'id of the user to query', parseUserId)
	.action(async (id) => await actionWrapper(getUserInfoCommand, id as string));

// register commands
program.addCommand(getCommand);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
program.parseAsync(process.argv);
