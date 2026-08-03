import { Router } from 'express';

import { getUserId } from '@olegpolyakov/backend/features/auth';

import type Context from '@/context.ts';

export default ({
    models: { Task }
}: Context) => {
    const router = Router();

    router.param('id', async (req, res, next, id) => {
        const userId = getUserId(req);
        const task = await Task.findOne({ _id: id, userId }, { _id: true });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        next();
    });
    
    router.get('/', async (req, res) => {
        const userId = getUserId(req);
        const tasks = await Task.find({ userId });

        res.status(200).json(tasks);
    });

    router.post('/', async (req, res) => {
        const userId = getUserId(req);
        const task = await Task.create({ ...req.body, userId });

        res.status(201).json(task);
    });

    router.put('/:id', async (req, res) => {
        const userId = getUserId(req);
        const task = await Task.findOneAndUpdate({ _id: req.params.id, userId }, req.body, { returnDocument: 'after' })
            .populate('tags');

        res.status(200).json(task);
    });

    router.patch('/:id', async (req, res) => {
        const userId = getUserId(req);
        const { completed } = req.body;

        const task = await Task.findOneAndUpdate({ _id: req.params.id, userId }, {
            completed
        }, { new: true }).populate('tags');

        res.status(200).json(task);
    });

    router.delete('/:id', async (req, res) => {
        const userId = getUserId(req);
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId });

        res.status(204).send({ id: task });
    });

    return router;
};