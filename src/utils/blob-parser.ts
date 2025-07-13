import { err, ok, Result } from 'neverthrow';

// TODO: this basic implementation works, but a complete FProperty + FArchive deserializer would be great

type ParsedResult = Record<string, number | bigint | (number | bigint)[]>;

const MAGIC_KEY_PADDING = 0x05;
const MAGIC_VALUE_PADDING = 0x0A;

// https://docs.python.org/3/library/struct.html#format-characters
type StructFCharacter = 'd' | 'f' | '?' | 'i' | 'B' | 'q' | 'h' | 'b' | 'Q' | 'I' | 'H';
type StructTypeLE = `<${StructFCharacter}`;
// type StructTypeBE = `>${StructFCharacter}`;
type StructType = StructTypeLE;

interface PropertyType
{
	width: number;
	structType: StructType;
}

// TODO: a python-like struct package would be good
const propertyTypes: Record<string, PropertyType> = {
	// https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/Core/UObject/EName
	ByteProperty: { width: 1, structType: '<B' },
	IntProperty: { width: 4, structType: '<i' },
	BoolProperty: { width: 1, structType: '<?' },
	FloatProperty: { width: 4, structType: '<f' },
	DoubleProperty: { width: 8, structType: '<d' },
	Int64Property: { width: 8, structType: '<q' },
	Int32Property: { width: 4, structType: '<i' },
	Int16Property: { width: 2, structType: '<h' },
	Int8Property: { width: 1, structType: '<b' },
	UInt64Property: { width: 8, structType: '<Q' },
	UInt32Property: { width: 4, structType: '<I' },
	UInt16Property: { width: 2, structType: '<H' },
};

const readFns: Record<StructType, (buf: Buffer, offset: number) => number | bigint> = {
	'<d': (b, o) => b.readDoubleLE(o),
	'<f': (b, o) => b.readFloatLE(o),
	'<i': (b, o) => b.readInt32LE(o),
	'<q': (b, o) => b.readBigInt64LE(o),
	'<h': (b, o) => b.readInt16LE(o),
	'<b': (b, o) => b.readInt8(o),
	'<Q': (b, o) => b.readBigUInt64LE(o),
	'<I': (b, o) => b.readUInt32LE(o),
	'<H': (b, o) => b.readUInt16LE(o),
	'<B': (b, o) => b.readUInt8(o),
	'<?': (b, o) => b.readUInt8(o),
};

const writeFns: Record<StructType, (buf: Buffer, offset: number, value: number | bigint) => number> = {
	'<d': (b, o, v) => b.writeDoubleLE(v as number, o),
	'<f': (b, o, v) => b.writeFloatLE(v as number, o),
	'<i': (b, o, v) => b.writeInt32LE(v as number, o),
	'<q': (b, o, v) => b.writeBigInt64LE(BigInt(v), o),
	'<h': (b, o, v) => b.writeInt16LE(v as number, o),
	'<b': (b, o, v) => b.writeInt8(v as number, o),
	'<Q': (b, o, v) => b.writeBigUInt64LE(BigInt(v), o),
	'<I': (b, o, v) => b.writeUInt32LE(v as number, o),
	'<H': (b, o, v) => b.writeUInt16LE(v as number, o),
	'<B': (b, o, v) => b.writeUInt8(v as number, o),
	'<?': (b, o, v) => b.writeUInt8(v as number, o),
};

function readStructValue(buffer: Buffer, offset: number, type: PropertyType)
{
	const fn = readFns[type.structType];
	if (!fn) return err(`Unknown struct type: ${type.structType}`);
	return ok(fn(buffer, offset));
}

function writeStructValue(buffer: Buffer, offset: number, value: number | bigint, type: PropertyType)
{
	const fn = writeFns[type.structType];
	if (!fn) return err(`Unknown struct type: ${type.structType}`);
	return ok(fn(buffer, offset, value));
}

function readNullTerminatedString(buffer: Buffer, offset: number)
{
	let end = offset;
	while (end < buffer.length && buffer[end] !== 0x00)
	{
		end++;
	}

	return buffer.toString('utf8', offset, end);
}

function getAllOffsets(blob: Buffer, key: string)
{
	const keyBuffer = Buffer.from(key, 'utf8');
	const results: {
		typeName: string;
		valueOffset: number;
		propertyType: PropertyType;
	}[] = [];

	let searchOffset = 0;

	while (searchOffset < blob.length)
	{
		const keyOffset = blob.indexOf(keyBuffer, searchOffset);
		if (keyOffset === -1) break;

		const typeOffset = keyOffset + key.length + MAGIC_KEY_PADDING;
		const typeName = readNullTerminatedString(blob, typeOffset);
		const propertyType = propertyTypes[typeName];

		const valueOffset = typeOffset + typeName.length + MAGIC_VALUE_PADDING;

		if (!propertyType)
		{
			searchOffset = valueOffset;
			continue;
		}

		results.push({ typeName, valueOffset, propertyType });
		searchOffset = valueOffset + propertyType.width;
	}

	return results;
}

export function parseBlob(blob: Buffer, keys: string[]): Result<{ result: ParsedResult; warnings: string[]; }, string>
{
	if (!Buffer.isBuffer(blob)) return err('Invalid blob input');
	if (!Array.isArray(keys)) return err('Keys must be an array');

	const result: ParsedResult = {};
	const warnings: string[] = [];

	for (const key of keys)
	{
		const matches = getAllOffsets(blob, key);

		if (matches.length === 0)
		{
			warnings.push(`No values found for key: "${key}"`);
			continue;
		}

		const values: (number | bigint)[] = [];

		for (const { valueOffset, propertyType, typeName } of matches)
		{
			const value = readStructValue(blob, valueOffset, propertyType);
			if (value.isOk())
			{
				values.push(value.value);
			}
			else warnings.push(`Failed to read "${key}" of type "${typeName}" at offset ${valueOffset}: ${value.error}`);
		}

		result[key] = values.length === 1 ? values[0]! : values;
	}

	return ok({ result, warnings });
}

export function updateBlob(blob: Buffer, key: string, newValue: number | bigint | (number | bigint)[])
{
	const matches = getAllOffsets(blob, key);

	if (matches.length === 0)
	{
		return err(`Cannot update: Key "${key}" not found.`);
	}

	if (Array.isArray(newValue))
	{
		if (newValue.length !== matches.length)
		{
			return err(`Array length mismatch for key "${key}". Expected ${matches.length}, got ${newValue.length}`);
		}

		for (let i = 0; i < matches.length; i++)
		{
			const { valueOffset, propertyType } = matches[i]!;
			const res = writeStructValue(blob, valueOffset, newValue[i]!, propertyType);
			if (res.isErr()) return err(`Error writing element ${i} of key "${key}": ${res.error}`);
		}
	}
	else
	{
		if (matches.length > 1)
		{
			return err(`Multiple entries found for key "${key}", but a single value was provided.`);
		}

		const { valueOffset, propertyType } = matches[0]!;
		const res = writeStructValue(blob, valueOffset, newValue, propertyType);
		if (res.isErr()) return err(`Error writing key "${key}": ${res.error}`);
	}

	return ok(blob);
}
