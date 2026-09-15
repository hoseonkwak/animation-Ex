import { DatabaseSync, type StatementSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

class PreparedStatementAdapter {
  constructor(
    private readonly statement: StatementSync,
    private readonly bindings: unknown[] = [],
  ) {}

  bind(...bindings: unknown[]): PreparedStatementAdapter {
    return new PreparedStatementAdapter(this.statement, bindings)
  }

  async all<T>(): Promise<D1Result<T>> {
    return {
      success: true,
      results: this.statement.all(...this.bindings) as T[],
      meta: {} as D1Meta,
    }
  }

  async first<T>(): Promise<T | null> {
    return (this.statement.get(...this.bindings) as T | undefined) ?? null
  }
}

export function createMigratedDatabase(): {
  sqlite: DatabaseSync
  d1: D1Database
} {
  const sqlite = new DatabaseSync(':memory:')
  const migrationsDirectory = path.resolve('db/migrations')

  for (const filename of readdirSync(migrationsDirectory).sort()) {
    sqlite.exec(readFileSync(path.join(migrationsDirectory, filename), 'utf8'))
  }
  sqlite.exec(readFileSync(path.resolve('db/seeds/wp1.sql'), 'utf8'))

  const d1 = {
    prepare(query: string) {
      return new PreparedStatementAdapter(sqlite.prepare(query))
    },
  } as unknown as D1Database

  return { sqlite, d1 }
}
