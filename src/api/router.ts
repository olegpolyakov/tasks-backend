import { Router } from 'express';

import { router as settings } from '@olegpolyakov/backend/features/settings';

import type Context from '../context';

import projects from './projects';
import tags from './tags';
import tasks from './tasks';

export default (context: Context) => {
    const router = Router();

    router.use('/projects', projects(context));
    router.use('/settings', settings(context));
    router.use('/tags', tags(context));
    router.use('/tasks', tasks(context));

    return router;
};