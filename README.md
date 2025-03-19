## Migrations

npm run typeorm -- migration:generate src/database/migrations/init -d ./data-source.ts

npm run typeorm -- migration:run -d ./data-source.ts
