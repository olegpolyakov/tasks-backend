import TasksDb from '@olegpolyakov/tasks-db';
import { authorize } from '@olegpolyakov/backend/features/auth';
import Server from '@olegpolyakov/backend/server';

import type Context from './context.ts';
import Router from './router.ts';

const {
    HOST = 'localhost',
    PORT = 3000,
    DB_CONNECTION_STRING = '',
    COOKIE_SECRET = 'cookie-secret',
    JWT_SECRET = 'jwt-secret'
} = process.env;

const tasksDb = TasksDb(DB_CONNECTION_STRING, { debug: true });

await tasksDb.connect();

const context: Context = {
    models: tasksDb.models
};

Server({
    host: HOST,
    port: PORT,
    cookies: {
        secret: COOKIE_SECRET
    },
    cors: true,
    json: true
})
    .use(authorize({ jwtSecret: JWT_SECRET }))
    .use('/api', Router(context))
    .start(() => {
        console.info(`Server is running on ${HOST}:${PORT}`);
    });