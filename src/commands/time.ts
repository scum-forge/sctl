import i18next from 'i18next';
import { err, ok } from 'neverthrow';
import { Logger } from '../classes/log-manager.ts';
import { formatFloat } from '../utils/utils.ts';

export interface TimeOptions
{
	timeSpeed: number;
	cycleHours: number;
	sunriseTime: string;
	sunsetTime: string;
}

export const defaultOptions: TimeOptions = {
	timeSpeed: 3.84,
	cycleHours: 24,
	sunriseTime: '06:00:00',
	sunsetTime: '21:00:00',
};

function timeStrToSeconds(time: string)
{
	const res = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.exec(time);
	if (!res) return err(i18next.t('commands.time.invalidTimeStr'));

	const [, h, m, s] = res;
	return ok(Number(h) * 3600 + Number(m) * 60 + Number(s));
}

export function calculateTime(options?: Partial<TimeOptions>)
{
	const opts = { ...defaultOptions, ...options };

	// real life hours required for a in-game cycle of "cycleHours" hours
	const realTimeCycle = opts.cycleHours / opts.timeSpeed;

	const sunrise = timeStrToSeconds(opts.sunriseTime);
	const sunset = timeStrToSeconds(opts.sunsetTime);

	if (sunrise.isErr()) return err(i18next.t('commands.time.errSunriseSec', { error: sunrise.error }));
	if (sunset.isErr()) return err(i18next.t('commands.time.errSunsetSec', { error: sunset.error }));

	const sunriseVal = sunrise.value;
	const sunsetVal = sunset.value;

	// in-game daylight hours
	let igDurationDay = 0;

	if (sunriseVal === sunsetVal)
	{
		// always night
		igDurationDay = 0;
	}
	else if (sunsetVal > sunriseVal)
	{
		// normal case: the day does not span midnight
		igDurationDay = (sunset.value - sunrise.value) / 3600;
	}
	else
	{
		// day spans midnight: from sunrise to 24:00, then from 00:00 to sunset
		// this can be used to force always daylight if both values are close enough
		// e.g. sunrise: 06:00:01, sunset: 06:00:00
		const secondsInDay = 86400; // 24 * 3600
		igDurationDay = ((secondsInDay - sunriseVal) + sunsetVal) / 3600;
	}

	// in-game daylight hours
	const percentageDay = (igDurationDay / opts.cycleHours) * 100;

	// in-game nightlight hours
	const igDurationNight = opts.cycleHours - igDurationDay;
	const percentageNight = 100 - percentageDay;

	// real-life daylight hours
	const rlDurationDay = (percentageDay / 100) * realTimeCycle;

	// real-life nightlight hours
	const rlDurationNight = (percentageNight / 100) * realTimeCycle;

	return ok({
		realTimeCycle,
		igDurationDay,
		igDurationNight,
		rlDurationDay,
		rlDurationNight,
		percentageDay,
		percentageNight,
	});
}

export function calculateTimeCommand(options: Partial<TimeOptions>)
{
	const opts = { ...defaultOptions, ...options };

	const ret = calculateTime(opts);
	if (ret.isOk())
	{
		console.table(ret.value);
		Logger.info(i18next.t('commands.time.okFirst', {
			sunrise: opts.sunriseTime,
			sunset: opts.sunsetTime,
			speed: opts.timeSpeed,
		}));

		Logger.info(i18next.t('commands.time.okSecond', {
			cycle: opts.cycleHours,
			hours: ret.value.realTimeCycle,
		}));

		Logger.info(i18next.t('commands.time.okThird', {
			day: formatFloat(ret.value.rlDurationDay),
			dayP: formatFloat(ret.value.percentageDay, 1),
			night: formatFloat(ret.value.rlDurationNight),
			nightP: formatFloat(ret.value.percentageNight, 1),
		}));

		Logger.info(i18next.t('commands.time.okFourth', {
			day: formatFloat(ret.value.igDurationDay),
			night: formatFloat(ret.value.igDurationNight),
		}));
	}
	else Logger.error(ret.error);
}
