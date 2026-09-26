import { Ollama, Router } from '@olegpolyakov/backend/features/ai';

import type { Context } from '@/context';

import Projects from './projects';
import Tags from './tags';
import Tasks from './tasks';

export default (context: Context) =>
    Router(Ollama(context.config.OLLAMA_TOKEN, {
        ...Projects(context),
        ...Tags(context),
        ...Tasks(context)
    }));