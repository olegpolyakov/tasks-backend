import { authorize } from '@olegpolyakov/backend/features/auth';
import Server from '@olegpolyakov/backend/server';

import Ai from './ai/index.ts';
import Api from './api/index.ts';
import Db from './db/index.ts';
import type Context from './context.ts';

const {
    HOST = 'localhost',
    PORT = 3000,
    DB_CONNECTION_STRING = '',
    COOKIE_SECRET = '',
    JWT_SECRET = '',
    OLLAMA_TOKEN = ''
} = process.env;

const db = Db(DB_CONNECTION_STRING, { debug: true });

await db.connect();

const context: Context = {
    config: {
        OLLAMA_TOKEN
    },
    models: db.models
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
    .use('/ai', Ai(context))
    .use('/api', Api(context))
    .start(() => {
        console.info(`Server is running on ${HOST}:${PORT}`);
    });