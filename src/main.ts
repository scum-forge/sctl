import { Command, program } from '@commander-js/extra-typings';
import i18next from 'i18next';
import pkgJson from '../package.json' with { type: 'json' };
import { getBodySimulationCommand } from './commands/body-simulation.ts';
import { calculateTimeCommand, defaultOptions as timeOpts } from './commands/time.ts';
import { getUserInfoCommand } from './commands/user-info.ts';
import { getVehicleOwnerCommand } from './commands/vehicle-owner.ts';
import { getAllUserVehiclesCommand } from './commands/vehicles.ts';
import { initI18n } from './utils/i18next.ts';
import { actionWrapper, parseFloatArg, parseIntArg, parseUserId } from './utils/utils.ts';

await initI18n(process.env.APP_LANG);

program
	.name('sctl')
	.description(i18next.t('program.description'))
	.option('--db <path>', i18next.t('program.options.db'), process.env.DATABASE_URL)
	.option('-v, --verbose', i18next.t('program.options.verbose'), ((_, previous) => previous + 1), 0)
	.version(pkgJson.version);

program.addCommand(
	new Command('time')
		.description(i18next.t('program.commands.time.description'))
		.argument('<sunrise>', i18next.t('program.commands.time.sunrise'))
		.argument('<sunset>', i18next.t('program.commands.time.sunset'))
		.argument('[speed]', i18next.t('program.commands.time.speed'), parseFloatArg, timeOpts.timeSpeed)
		.action((sunrise, sunset, speed) => actionWrapper(calculateTimeCommand, {
			sunriseTime: sunrise,
			sunsetTime: sunset,
			timeSpeed: speed,
		}))
);

const idHelp = i18next.t('program.commands.get.idHelp');

const getCommand = new Command('get')
	.description(i18next.t('program.commands.get.description'));

getCommand
	.command('vehicle-owner')
	.description(i18next.t('program.commands.get.commands.vehicle-owner.description'))
	.argument('<vehicleId>', i18next.t('program.commands.get.commands.vehicle-owner.vehicleId'), parseIntArg)
	.action(async (vehicleId) => await actionWrapper(getVehicleOwnerCommand, vehicleId));

getCommand
	.command('vehicles')
	.description(i18next.t('program.commands.get.commands.vehicles.description'))
	.addHelpText('after', idHelp)
	.argument('<id>', i18next.t('program.commands.get.commands.vehicles.id'), parseUserId)
	.action(async (id) => await actionWrapper(getAllUserVehiclesCommand, id as string));

getCommand
	.command('body-simulation')
	.description(i18next.t('program.commands.get.commands.body-simulation.description'))
	.addHelpText('after', idHelp)
	.argument('<id>', i18next.t('program.commands.get.commands.body-simulation.id'), parseUserId)
	.option('-p, --props <names...>', i18next.t('program.commands.get.commands.body-simulation.props'))
	.action(async (id, options) => await actionWrapper(getBodySimulationCommand, id as string, options.props));

getCommand
	.command('user-info')
	.description(i18next.t('program.commands.get.commands.user-info.description'))
	.addHelpText('after', idHelp)
	.argument('<id>', i18next.t('program.commands.get.commands.user-info.id'), parseUserId)
	.action(async (id) => await actionWrapper(getUserInfoCommand, id as string));

// register commands
program.addCommand(getCommand);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
program.parseAsync(process.argv);
