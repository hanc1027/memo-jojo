export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`遺失必要的環境變數: ${name}`);
  }
  return value;
}
