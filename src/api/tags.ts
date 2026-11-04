import { Router } from 'express';

import { getUserId } from '@olegpolyakov/backend/features/auth';

import type { Context } from '@/context';

export default ({
    models: { Tag, Task }
}: Context) => {
    const router = Router();

    router.get('/', async (req, res) => {
        const userId = getUserId(req);

        const tags = await Tag.find({ userId });

        res.status(200).json(tags);
    });

    router.get('/:id', async (req, res) => {
        const userId = getUserId(req);

        const tag = await Tag.findOne({ _id: req.params.id, userId });

        res.status(200).json(tag);
    });

    router.post('/', async (req, res) => {
        const userId = getUserId(req);

        const tag = await Tag.create({ ...req.body, userId });

        res.status(201).json(tag);
    });

    router.put('/:id', async (req, res) => {
        const userId = getUserId(req);

        const tag = await Tag.update({ _id: req.params.id, userId }, req.body);

        res.status(200).json(tag);
    });

    router.delete('/:id', async (req, res) => {
        const userId = getUserId(req);

        const tag = await Tag.delete({ _id: req.params.id, userId });
        await Task.updateMany({
            tagIds: tag.id,
            userId
        }, {
            $pull: { tagIds: tag.id }
        });
        
        res.status(204).send(tag);
    });

    return router;
};