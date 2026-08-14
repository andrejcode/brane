import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import BetterSqlite3 from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { logger } from '../logger'
import { baseDir, databasePath } from '../paths'
import * as schema from './schema'

export type BraneDatabase = BetterSQLite3Database<typeof schema>

let client: BetterSqlite3.Database | undefined
let database: BraneDatabase | undefined

// Packaging ships the migrations as an extra resource, since they're read from
// disk and can't live inside the asar.
function resolveMigrationsFolder() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'drizzle')
    : path.join(app.getAppPath(), 'drizzle')
}

export function initializeDatabase() {
  if (database) {
    return database
  }

  try {
    fs.mkdirSync(baseDir, { recursive: true })

    const connection = new BetterSqlite3(databasePath)
    // SQLite defaults both of these off, and message deletes rely on cascades.
    connection.pragma('journal_mode = WAL')
    connection.pragma('foreign_keys = ON')

    const instance = drizzle(connection, { schema })
    migrate(instance, { migrationsFolder: resolveMigrationsFolder() })

    client = connection
    database = instance
    logger.info(`Database ready at ${databasePath}`)

    return instance
  } catch (error) {
    logger.error('Failed to open the database', error)
    throw new Error('Brane could not open its local database.')
  }
}

export function getDatabase() {
  if (!database) {
    throw new Error('The database is not ready yet.')
  }

  return database
}

export function closeDatabase() {
  client?.close()
  client = undefined
  database = undefined
}
