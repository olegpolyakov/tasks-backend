import { Ollama, Router } from '@olegpolyakov/backend/features/ai';

import type { Context } from '@/context.ts';

import Projects from './projects.ts';
import Tags from './tags.ts';
import Tasks from './tasks.ts';

export default (context: Context) =>
    Router(Ollama(context.config.OLLAMA_TOKEN, {
        ...Projects(context),
        ...Tags(context),
        ...Tasks(context)
    }));