import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './config/schema.tsx',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_j9zUEicAJO5m@ep-purple-tooth-a83ecy66-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});
