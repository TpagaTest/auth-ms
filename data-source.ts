import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'database',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'tpaga',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false,
});

AppDataSource.initialize()
.then(() => {
  console.log('Data Source has been initialized!');
})
.catch((err) => {
  console.error('Error during Data Source initialization', err);
});
