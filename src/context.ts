import { createContext } from '@olegpolyakov/backend/context';

import type { Models } from './models';

export type Context = {
    config: {
        OLLAMA_TOKEN: string;
    };
    models: Models;
};

export default (value: Context) => createContext<Context>(value);