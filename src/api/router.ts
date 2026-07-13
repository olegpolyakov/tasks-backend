import { Router } from 'express';

import { router as settings } from '@olegpolyakov/backend/features/settings';

import type Context from '../context.ts';

import tags from './tags.ts';
import tasks from './tasks.ts';

export default (context: Context) => {
    const router = Router();

    router.use('/settings', settings(context));
    router.use('/tags', tags(context));
    router.use('/tasks', tasks(context));

    return router;
};