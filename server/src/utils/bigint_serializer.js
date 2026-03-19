// Helper to JSON.stringify objects that may contain BigInt values.
// Use this when printing or returning data from Node code that may include BigInt.
export function stringifyWithBigInt(obj, space = 2) {
  return JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  space);
}

export default stringifyWithBigInt;
