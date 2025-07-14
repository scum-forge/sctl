import { InvalidArgumentError, program } from '@commander-js/extra-typings';
import i18next from 'i18next';
import { join } from 'node:path';
import type { Callback, RootOptions } from '../@types/types.ts';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';

export type ExtractedUserId = string | number;

export async function actionWrapper<T extends unknown[], V>(cb: Callback<T, V>, ...opts: T)
{
	const rootOpts = program.opts() as RootOptions;

	if (rootOpts.verbose === 1) Logger.level = 'debug';
	else if (rootOpts.verbose >= 2) Logger.level = 'trace';

	Logger.debug(`DATABASE_URL: ${process.env.DATABASE_URL}`);
	Logger.debug(`APP_LANG: ${process.env.APP_LANG}`);

	// Logger.debug('Loading i18next...');
	// await initI18n(process.env.APP_LANG);

	if (rootOpts.db && rootOpts.db !== process.env.DATABASE_URL)
	{
		const newPath = `file:${join('..', rootOpts.db)}`;
		Logger.debug(i18next.t('debug.setDatabaseUrl', { newPath }));
		process.env.DATABASE_URL = newPath;
	}

	try
	{
		Logger.debug(i18next.t('debug.db.connecting'));
		await DatabaseManager.init();

		const t0 = performance.now();
		await cb(...opts);
		Logger.debug(i18next.t('debug.commandExecTime', { time: (performance.now() - t0).toFixed(2) }));
	}
	catch (e)
	{
		Logger.error(e instanceof Error ? e.message : e);
	}
	finally
	{
		Logger.debug(i18next.t('debug.db.disconnecting'));
		await DatabaseManager.disconnect();
	}
}

export function extractUserId(input: string): ExtractedUserId | null
{
	const steamRegex = /^(?:(?:steam|sid|s):)?(\d+)$/i;
	const profileRegex = /^(?:(?:profile|uid|p):)?(\d+)$/i;

	const steamMatch = steamRegex.exec(input);
	if (steamMatch) return steamMatch[1] ?? null;

	const profileMatch = profileRegex.exec(input);
	if (profileMatch)
	{
		const numb = Number(profileMatch[1]);
		return !Number.isNaN(numb) ? numb : null;
	}

	return null;
}

export function parseIntArg(value: string)
{
	const parsed = parseInt(value, 10);
	if (Number.isNaN(parsed)) throw new InvalidArgumentError(i18next.t('errors.notANumber'));

	return parsed;
}

export function parseUserId(value: string)
{
	const parsed = extractUserId(value);
	if (parsed == null) throw new InvalidArgumentError(i18next.t('errors.invalidUserIdFormat'));

	return parsed;
}
