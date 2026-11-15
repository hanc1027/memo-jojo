import mysql from "mysql2/promise";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`遺失必要的環境變數: ${name}`);
  }
  return value;
}

export const pool = mysql.createPool({
  host: requireEnv("DB_HOST"),
  port: Number(requireEnv("DB_PORT")),
  user: requireEnv("MYSQL_USER"),
  password: requireEnv("MYSQL_PASSWORD"),
  database: requireEnv("MYSQL_DATABASE"),
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+08:00"
});