import { Router } from '@olegpolyakov/backend/features/ai';

import type { Context } from '@/context';

import projects from './projects';
import tags from './tags';
import tasks from './tasks';

export default (context: Context) => Router({
    ...projects(context),
    ...tags(context),
    ...tasks(context)
});