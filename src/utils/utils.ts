import { InvalidArgumentError } from 'commander';

export function parseIntArg(value: string)
{
	const parsed = parseInt(value, 10);
	if (Number.isNaN(parsed)) throw new InvalidArgumentError('Not a number.');

	return parsed;
}

export function getUserId(xml: string)
{
	/**
	 * It would be better to parse the XML with an XML parser, but that
	 * requires a third-party dependency.
	 * For the sake of simplicity, I use regex instead.
	 * (It should be okay for this use case)
	 */
	const match = /_owningUserProfileId="(\d+)"/.exec(xml);
	if (!match)
	{
		throw new Error('Could not find _owningUserProfileId in the XML.');
	}

	const ret = Number(match[1]);
	return Number.isNaN(ret) ? 0 : ret;

	// Requires a third party dependency: fast-xml-parser
	// import { XMLParser } from 'fast-xml-parser';
	/* interface ItemXml
	{
		Item: {
			'@_owningUserProfileId': number;
		};
	}

	const parser = new XMLParser({
		ignoreAttributes: false,
		parseAttributeValue: true,
		attributeNamePrefix: '@',
		trimValues: true,
		ignoreDeclaration: true,
	});

	const parsed = parser.parse(xml) as ItemXml;
	return parsed.Item['@_owningUserProfileId']; */
}
