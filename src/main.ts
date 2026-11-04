import Db from '@olegpolyakov/backend/db';
import Changes from '@olegpolyakov/backend/db/changes';
import { auth } from '@olegpolyakov/backend/features/auth';
import Server from '@olegpolyakov/backend/server';
import Ws from '@olegpolyakov/backend/server/ws';

import Api from './api';
import Context from './context';
import Mcp from './mcp';
import Models from './models';

const {
    DOMAIN = '',
    HOST = 'localhost',
    PORT = 3000,
    DB_URL = '',
    COOKIE_SECRET = '',
    JWT_SECRET = '',
    OLLAMA_TOKEN = ''
} = process.env;

const config = {
    OLLAMA_TOKEN
};

const db = await Db(DB_URL, { debug: true }).connect();
const models = Models(db);
const context = Context({
    config,
    models
}).build();

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
    .use('/api', Api(context))
    .use('/mcp', Mcp(context))
    .plugin(Ws({ path: '/ws', jwtSecret: JWT_SECRET }, [Changes(models)]))
    .start(() => {
        console.info(`Server is running on ${HOST}:${PORT}`);
    });