import postgres from 'postgres';

const globalForPostgres = global as unknown as {
    sql: postgres.Sql<{}> | undefined;
};

const sql =
    globalForPostgres.sql ??
    postgres(process.env.DATABASE_URL!, {
        ssl: 'require',
        max: 1, // Limit connections per instance to avoid "max clients" error
        idle_timeout: 20, // Close idle connections after 20s
        connect_timeout: 10,
    });

if (process.env.NODE_ENV !== 'production') globalForPostgres.sql = sql;

export default sql;
