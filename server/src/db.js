import sqlite3 from 'sqlite3'
import { DATABASE_PATH } from './config.js'
import { mkdirSync, existsSync } from 'fs'
import path from 'path'

sqlite3.verbose()

const dbDir = path.dirname(DATABASE_PATH)
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

export const db = new sqlite3.Database(DATABASE_PATH)

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;')
})

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err)
      resolve(this)
    })
  })
}

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err)
      resolve(row)
    })
  })
}

export const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}
