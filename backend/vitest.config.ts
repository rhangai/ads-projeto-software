import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Cada arquivo de teste roda isolado e com o próprio banco SQLite em memória.
    env: { DB_FILE: ':memory:' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        // Pontos de entrada e scripts de linha de comando: só chamam código já testado
        // (criarApp, runMigrations) e não têm lógica própria.
        'src/server.ts',
        'src/db/migrate.ts',
        'src/db/seed.ts',
        'src/db/reset.ts',
      ],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
    },
  },
});
