import mysql from 'mysql2/promise'
import { config } from './config.js'

export const pool = mysql.createPool(config.db)

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params)
  return rows
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] ?? null
}

export async function ping() {
  await pool.query('SELECT 1 AS ok')
}

export async function closePool() {
  await pool.end()
}
