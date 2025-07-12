import { err, ok } from 'neverthrow';

const MAGIC_KEY_PADDING = 0x05;
const MAGIC_VALUE_PADDING = 0x0A;

// https://docs.python.org/3/library/struct.html#format-characters
type StructType = | '<d' | '<f' | '<?' | '<i' | '<B' | '<q' | '<h' | '<b' | '<Q' | '<I' | '<H';

interface PropertyType
{
	width: number;
	structType: StructType;
}

// TODO: a python-like struct package would be good
const propertyTypes: Record<string, PropertyType> = {
	// https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/Core/UObject/EName
	// https://github.com/EpicGames/UnrealEngine/blob/release/Engine/Source/Runtime/Core/Public/UObject/UnrealNames.inl
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

function readStructValue(buffer: Buffer, offset: number, type: PropertyType)
{
	switch (type.structType)
	{
		case '<d': return ok(buffer.readDoubleLE(offset));
		case '<f': return ok(buffer.readFloatLE(offset));
		case '<i': return ok(buffer.readInt32LE(offset));
		case '<q': return ok(buffer.readBigInt64LE(offset)); // bigint
		case '<h': return ok(buffer.readInt16LE(offset));
		case '<b': return ok(buffer.readInt8(offset));
		case '<Q': return ok(buffer.readBigUInt64LE(offset)); // bigint
		case '<I': return ok(buffer.readUInt32LE(offset));
		case '<H': return ok(buffer.readUInt16LE(offset));
		case '<B': return ok(buffer.readUInt8(offset));
		case '<?': return ok(buffer.readUInt8(offset));
		default: return err(`Unknown struct type: ${type.structType as PropertyType['structType']}`);
	}
}

function writeStructValue(buffer: Buffer, offset: number, value: number | bigint, type: PropertyType)
{
	switch (type.structType)
	{
		// TODO: "as number" is hacky
		case '<d': return ok(buffer.writeDoubleLE(value as number, offset));
		case '<f': return ok(buffer.writeFloatLE(value as number, offset));
		case '<i': return ok(buffer.writeInt32LE(value as number, offset));
		case '<q': return ok(buffer.writeBigInt64LE(BigInt(value), offset));
		case '<h': return ok(buffer.writeInt16LE(value as number, offset));
		case '<b': return ok(buffer.writeInt8(value as number, offset));
		case '<Q': return ok(buffer.writeBigUInt64LE(BigInt(value), offset));
		case '<I': return ok(buffer.writeUInt32LE(value as number, offset));
		case '<H': return ok(buffer.writeUInt16LE(value as number, offset));
		case '<B':
		case '<?': return ok(buffer.writeUInt8(value as number, offset));
		default: return err(`Unknown struct type: ${type.structType as PropertyType['structType']}`);
	}
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

function getOffsets(blob: Buffer, key: string)
{
	const keyBuffer = Buffer.from(key, 'utf8');
	const keyOffset = blob.indexOf(keyBuffer);
	if (keyOffset === -1) return null;

	const typeOffset = keyOffset + key.length + MAGIC_KEY_PADDING;
	const typeName = readNullTerminatedString(blob, typeOffset);

	const propertyType = propertyTypes[typeName];
	if (!propertyType) return null;

	const valueOffset = typeOffset + typeName.length + MAGIC_VALUE_PADDING;
	return { typeName, valueOffset, propertyType };
}

export function parseBlob(blob: Buffer, keys: string[])
{
	const result: Record<string, number | bigint> = {};

	const warnings: string[] = [];

	for (const key of keys)
	{
		const offsetData = getOffsets(blob, key);
		if (!offsetData)
		{
			warnings.push(`Key or type not found or unsupported: ${key}`);
			continue;
		}

		const { valueOffset, propertyType } = offsetData;

		try
		{
			const value = readStructValue(blob, valueOffset, propertyType);
			if (value.isErr())
			{
				warnings.push(value.error);
				continue;
			}

			result[key] = value.value;
		}
		catch (e)
		{
			return err(`Error reading value for key "${key}": ${(e as Error).message}`);
		}
	}

	return ok({ result, warnings });
}

/**
 *
 * @example
 * ```
 * const modifiedBlob = Buffer.from(originalBlob); // make a copy
 * updateBlob(modifiedBlob, 'BaseStrength', 6.5);
 * ```
 */
export function updateBlob(blob: Buffer, key: string, newValue: number | bigint)
{
	const offsetData = getOffsets(blob, key);
	if (!offsetData) return err(`Cannot update: Key "${key}" or its type was not found.`);

	const { valueOffset, propertyType } = offsetData;

	const res = writeStructValue(blob, valueOffset, newValue, propertyType);
	if (res.isErr()) return err(res.error);

	return ok(blob);
}
