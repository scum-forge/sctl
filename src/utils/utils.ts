import { InvalidArgumentError } from 'commander';

export function parseIntArg(value: string)
{
	const parsed = parseInt(value, 10);
	if (Number.isNaN(parsed)) throw new InvalidArgumentError('Not a number.');

	return parsed;
}
