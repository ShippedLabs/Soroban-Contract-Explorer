import { StrKey } from "@stellar/stellar-sdk";
import type { SorobanType } from "@/types/contract";

const U32_MAX = 4_294_967_295n;
const I32_MIN = -2_147_483_648n;
const I32_MAX = 2_147_483_647n;
const U64_MAX = 18_446_744_073_709_551_615n;
const I64_MIN = -9_223_372_036_854_775_808n;
const I64_MAX = 9_223_372_036_854_775_807n;
const U128_MAX = 2n ** 128n - 1n;
const I128_MIN = -(2n ** 127n);
const I128_MAX = 2n ** 127n - 1n;

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
      return validateInt(value, 0n, U32_MAX, "U32");
    case "I32":
      return validateInt(value, I32_MIN, I32_MAX, "I32");
    case "U64":
      return validateInt(value, 0n, U64_MAX, "U64");
    case "I64":
      return validateInt(value, I64_MIN, I64_MAX, "I64");
    case "U128":
      return validateInt(value, 0n, U128_MAX, "U128");
    case "I128":
      return validateInt(value, I128_MIN, I128_MAX, "I128");
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
