import { Router } from 'express';

import { getUserId } from '@olegpolyakov/backend/features/auth';

import type Context from '@/context.ts';

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
        const tag = await Tag.findOneAndUpdate({ _id: req.params.id, userId }, req.body, { new: true });

        res.status(200).json(tag);
    });

    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        const userId = getUserId(req);
        const { deleteTasks = false } = req.body;

        await Tag.deleteOne({ _id: id, userId });

        if (deleteTasks) {
            await Task.updateMany({
                tagsId: id,
                userId
            }, {
                $pull: { tagsId: id }
            });
        }

        res.status(204).send({ id });
    });

    return router;
};