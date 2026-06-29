import { StrKey } from "@stellar/stellar-sdk";
import type { SorobanType } from "@/types/contract";

const U32_MAX = BigInt("4294967295");
const I32_MIN = BigInt("-2147483648");
const I32_MAX = BigInt("2147483647");
const U64_MAX = BigInt("18446744073709551615");
const I64_MIN = BigInt("-9223372036854775808");
const I64_MAX = BigInt("9223372036854775807");
const U128_MAX = BigInt("340282366920938463463374607431768211455");
const I128_MIN = BigInt("-170141183460469231731687303715884105728");
const I128_MAX = BigInt("170141183460469231731687303715884105727");
const U256_MAX = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");
const I256_MIN = BigInt("-57896044618658097711785492504343953926634992332820282019728792003956564819968");
const I256_MAX = BigInt("57896044618658097711785492504343953926634992332820282019728792003956564819967");

const SYMBOL_REGEX = /^[a-zA-Z0-9_]{0,32}$/;
const HEX_REGEX = /^[0-9a-fA-F]*$/;

function tryBigInt(value: string): bigint | null {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function inRange(n: bigint, min: bigint, max: bigint): boolean {
  return n >= min && n <= max;
}

function validateInt(
  value: string,
  min: bigint,
  max: bigint,
  label: string
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  const n = tryBigInt(trimmed);
  if (n === null) return `${label} must be a whole number`;
  if (!inRange(n, min, max)) return `${label} out of range`;
  return null;
}

function validateAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Address is required";
  if (
    StrKey.isValidEd25519PublicKey(trimmed) ||
    StrKey.isValidContract(trimmed)
  ) {
    return null;
  }
  return "Must be a valid Stellar address (G...) or contract ID (C...)";
}

function validateBytes(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Hex string is required";
  if (trimmed.length % 2 !== 0) return "Hex string must have an even length";
  if (!HEX_REGEX.test(trimmed)) return "Only hex characters (0-9, a-f) allowed";
  return null;
}

function validateBool(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "true" || trimmed === "false") return null;
  return "Must be true or false";
}

function validateSymbol(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Symbol is required";
  if (!SYMBOL_REGEX.test(trimmed)) {
    return "Letters, numbers, and underscores only (max 32 chars)";
  }
  return null;
}

export function validateValue(
  value: string,
  type: SorobanType,
  inner?: SorobanType
): string | null {
  switch (type) {
    case "U32":
      return validateInt(value, BigInt(0), U32_MAX, "U32");
    case "I32":
      return validateInt(value, I32_MIN, I32_MAX, "I32");
    case "U64":
      return validateInt(value, BigInt(0), U64_MAX, "U64");
    case "I64":
      return validateInt(value, I64_MIN, I64_MAX, "I64");
    case "U128":
      return validateInt(value, BigInt(0), U128_MAX, "U128");
    case "I128":
      return validateInt(value, I128_MIN, I128_MAX, "I128");
    case "U256":
      return validateInt(value, BigInt(0), U256_MAX, "U256");
    case "I256":
      return validateInt(value, I256_MIN, I256_MAX, "I256");
    case "Timepoint":
      return validateInt(value, BigInt(0), U64_MAX, "Timepoint (seconds since epoch)");
    case "Duration":
      return validateInt(value, BigInt(0), U64_MAX, "Duration (seconds)");
    case "Bool":
      return validateBool(value);
    case "Bytes":
      return validateBytes(value);
    case "Address":
      return validateAddress(value);
    case "Symbol":
      return validateSymbol(value);
    case "String":
      return value.trim() ? null : "String is required";
    case "Option":
      if (!value.trim()) return null;
      return inner ? validateValue(value, inner) : null;
    case "Vec": {
      const items = value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      if (items.length === 0) return "At least one item required";
      if (!inner) return null;
      for (const item of items) {
        const err = validateValue(item, inner);
        if (err) return `Item "${item}": ${err}`;
      }
      return null;
    }
    case "Unknown":
      return null;
    default:
      return null;
  }
}
