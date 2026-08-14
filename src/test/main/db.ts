import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../../main/db/schema'

type TestDatabase = ReturnType<typeof createTestDatabase>

let client: BetterSqlite3.Database | undefined
let database: TestDatabase | undefined

// Runs the generated migrations, so schema drift fails the suite too.
function createTestDatabase() {
  const connection = new BetterSqlite3(':memory:')
  connection.pragma('foreign_keys = ON')

  const instance = drizzle(connection, { schema })
  migrate(instance, { migrationsFolder: 'drizzle' })

  client = connection

  return instance
}

export function createDatabaseMock() {
  return {
    getDatabase: () => {
      if (!database) {
        throw new Error('Call resetDatabaseMock() before using the database.')
      }

      return database
    },
  }
}

export function resetDatabaseMock() {
  client?.close()
  database = createTestDatabase()
}

export function closeDatabaseMock() {
  client?.close()
  client = undefined
  database = undefined
}
