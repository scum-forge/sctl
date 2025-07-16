import { Command, program } from '@commander-js/extra-typings';
import i18next from 'i18next';
import pkgJson from '../package.json' with { type: 'json' };
import { getBodySimulationCommand } from './commands/body-simulation.ts';
import { calculateTimeCommand, defaultOptions as timeOpts } from './commands/time.ts';
import { getUserInfoCommand } from './commands/user-info.ts';
import { getVehicleOwnerCommand } from './commands/vehicle-owner.ts';
import { getAllUserVehiclesCommand } from './commands/vehicles.ts';
import { initI18n } from './utils/i18next.ts';
import { actionWrapper, parseFloatArg } from './utils/utils.ts';

await initI18n(process.env.APP_LANG);

program
	.name('sctl')
	.description(i18next.t('program.description'))
	.option('--db <path>', i18next.t('program.options.db'), process.env.DATABASE_URL)
	.option('-v, --verbose', i18next.t('program.options.verbose'), ((_, previous) => previous + 1), 0)
	.version(pkgJson.version)

	.addCommand(new Command('time')
		.description(i18next.t('program.commands.time.description'))
		.argument('<sunrise>', i18next.t('program.commands.time.sunrise'))
		.argument('<sunset>', i18next.t('program.commands.time.sunset'))
		.argument('[speed]', i18next.t('program.commands.time.speed'), parseFloatArg, timeOpts.timeSpeed)
		.action((sunrise, sunset, speed) => actionWrapper(calculateTimeCommand, {
			sunriseTime: sunrise,
			sunsetTime: sunset,
			timeSpeed: speed,
		})))

	.addCommand(new Command('get')
		.description(i18next.t('program.commands.get.description'))
		.addCommand(getVehicleOwnerCommand())
		.addCommand(getAllUserVehiclesCommand())
		.addCommand(getBodySimulationCommand())
		.addCommand(getUserInfoCommand()));

// eslint-disable-next-line @typescript-eslint/no-floating-promises
program.parseAsync(process.argv);
