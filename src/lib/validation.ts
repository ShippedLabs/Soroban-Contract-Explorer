const CONTRACT_ID_REGEX = /^C[A-Z2-7]{55}$/;

export function isValidContractId(value: string): boolean {
  return CONTRACT_ID_REGEX.test(value);
}
