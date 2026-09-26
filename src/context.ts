import { Models } from './db';

export type Context = {
    config: {
        OLLAMA_TOKEN: string;
    };
    models: Models;
};

export default Context;