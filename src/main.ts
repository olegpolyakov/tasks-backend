import { auth } from '@olegpolyakov/backend/features/auth';
import Server from '@olegpolyakov/backend/server';

import Ai from './ai/index.ts';
import Api from './api/index.ts';
import Db from './db/index.ts';
import Mcp from './mcp/index.ts';
import type Context from './context.ts';
import Ws from './ws.ts';

const {
    DOMAIN = '',
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
    cors: {
        domain: DOMAIN
    },
    json: true
})
    .use(auth({ jwtSecret: JWT_SECRET }))
    .use('/ai', Ai(context))
    .use('/api', Api(context))
    .use('/mcp', Mcp(context))
    .plugin(Ws(context))
    .start(() => {
        console.info(`Server is running on ${HOST}:${PORT}`);
    });