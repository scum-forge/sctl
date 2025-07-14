import type { LeveledLogMethod, LoggerOptions, Logger as WinstonLogger } from 'winston';
import { addColors, createLogger, format, transports } from 'winston';

export const logsFolder = 'logs';

interface CustomLogger extends Omit<WinstonLogger,
	'help' | 'data' | 'prompt' | 'http' | 'verbose' | 'input' | 'silly'
	| 'emerg' | 'alert' | 'crit' | 'warning' | 'notice'>
{
	fatal: LeveledLogMethod;
	trace: LeveledLogMethod;
}

const customLevels = {
	levels: {
		off: 0,
		fatal: 1,
		error: 2,
		warn: 3,
		info: 4,
		debug: 5,
		trace: 6,
	},
	colors: {
		off: 'gray',
		fatal: 'brightMagenta',
		error: 'brightRed',
		warn: 'brightYellow',
		info: 'brightCyan',
		debug: 'gray',
		trace: 'gray',
	},
};

const formats = {
	console: format.combine(
		format.timestamp({ format: 'HH:mm:ss' }),
		// format.label({ label: 'LOGGER' }),
		// format.printf((info) => `${info.label as string}  ${info.timestamp as string}  ${info.level} : ${info.message as string}`),
		format.printf((info) => `[${info.timestamp as string} | ${info.level.toUpperCase()}]${info.level === 'info' ? '\x1b[0m' : ''} : ${info.message as string}`),
		format.colorize({ all: true }),
	),

	file: format.combine(
		format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		// format.label({ label: 'My Label' }),
		format.printf((info) => `${info.timestamp as string}  [${info.level}]  ${info.message as string}`),
	),
};

const options = {
	level: 'info',
	levels: customLevels.levels,

	transports: [
		new transports.Console({
			format: formats.console,
		}),

		/* new transports.File({
			level: 'error',
			filename: 'error.log',
			dirname: logsFolder,
			format: formats.file,
		}), */
	],
} as LoggerOptions;

addColors(customLevels.colors);

export const Logger = createLogger(options) as unknown as CustomLogger;
