import { Models } from './db/index.ts';

export type Context = {
    config: {
        OLLAMA_TOKEN: string;
    };
    models: Models;
};

export default Context;