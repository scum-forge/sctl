import { InvalidArgumentError, program } from '@commander-js/extra-typings';
import { join } from 'node:path';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';
import type { Callback, RootOptions } from './types.ts';

export type ExtractedUserId = string | number;

export async function actionWrapper<T extends unknown[], V>(cb: Callback<T, V>, ...opts: T)
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

		const t0 = performance.now();
		await cb(...opts);
		Logger.debug(`Command execution took ${(performance.now() - t0).toFixed(2)}ms`);
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
	if (Number.isNaN(parsed)) throw new InvalidArgumentError('Not a number.');

	return parsed;
}

export function parseUserId(value: string)
{
	const parsed = extractUserId(value);
	if (parsed == null) throw new InvalidArgumentError('Invalid user id format.');

	return parsed;
}
