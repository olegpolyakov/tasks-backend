import Context from '@olegpolyakov/backend/context';
import type { Models } from '@olegpolyakov/backend/db';

import * as schemas from './schemas';

export type Context = {
    config: {
        OLLAMA_TOKEN: string;
    };
    models: Models<typeof schemas>;
};

export default (value: Context) => Context<Context>(value);