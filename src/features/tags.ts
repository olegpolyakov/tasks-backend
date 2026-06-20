import { Request, Router } from 'express';

import type Context from '@/context.ts';

export default ({
    models: { Tag, Task }
}: Context) => {
    const router = Router();

    router.get('/', async (req, res) => {
        const tags = await Tag.find();

        res.status(200).json(tags);
    });

    router.get('/:id', async (req, res) => {
        const tag = await Tag.findById(req.params.id);

        res.status(200).json(tag);
    });

    router.post('/', async (req, res) => {
        const userId = (req as Request & { userId: string }).userId;
        const tag = await Tag.create({ ...req.body, userId });

        res.status(201).json(tag);
    });

    router.put('/:id', async (req, res) => {
        const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true });

        res.status(200).json(tag);
    });

    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        const { deleteTasks = false } = req.body;

        await Tag.deleteOne({ _id: id });

        if (deleteTasks) {
            await Task.updateMany({
                tagsId: id
            }, {
                $pull: { tagsId: id }
            });
        }

        res.status(204).send({ id });
    });

    return router;
};