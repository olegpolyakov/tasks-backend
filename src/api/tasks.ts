import { Request, Router } from 'express';

import type Context from '@/context.ts';

export default ({
    models: { Task }
}: Context) => {
    const router = Router();

    router.param('id', async (req, res, next, id) => {
        const task = await Task.findById(id, { _id: true });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        next();
    });
    
    router.get('/', async (req, res) => {
        const tasks = await Task.find();

        res.status(200).json(tasks);
    });

    router.post('/', async (req, res) => {
        const userId = (req as Request & { userId: string }).userId;
        const task = await Task.create({ ...req.body, userId });

        res.status(201).json(task);
    });

    router.put('/:id', async (req, res) => {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('tags');

        res.status(200).json(task);
    });

    router.patch('/:id', async (req, res) => {
        const { completed } = req.body;

        const task = await Task.findByIdAndUpdate(req.params.id, {
            completed
        }, { new: true }).populate('tags');

        res.status(200).json(task);
    });

    router.delete('/:id', async (req, res) => {
        const task = await Task.findByIdAndDelete(req.params.id);

        res.status(204).send({ id: task });
    });

    return router;
};