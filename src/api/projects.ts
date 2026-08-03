import { randomUUID } from 'node:crypto';

import { Router } from 'express';

import { getUserId } from '@olegpolyakov/backend/features/auth';

import type Context from '@/context.ts';

export default ({
    models: { Project, Task }
}: Context) => {
    const router = Router();

    router.param('id', async (req, res, next, id) => {
        const userId = getUserId(req);
        const project = await Project.findOne({ _id: id, userId }, { _id: true });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        next();
    });

    router.get('/', async (req, res) => {
        const userId = getUserId(req);
        const projects = await Project.find({ userId });

        res.status(200).json(projects);
    });

    router.get('/:id', async (req, res) => {
        const userId = getUserId(req);
        const project = await Project.findOne({ _id: req.params.id, userId });

        res.status(200).json(project);
    });

    router.post('/', async (req, res) => {
        const userId = getUserId(req);
        const project = await Project.create({ ...req.body, userId });

        res.status(201).json(project);
    });

    router.put('/:id', async (req, res) => {
        const userId = getUserId(req);
        const project = await Project.findOneAndUpdate({ _id: req.params.id, userId }, req.body, { returnDocument: 'after' });

        res.status(200).json(project);
    });

    router.delete('/:id', async (req, res) => {
        const userId = getUserId(req);
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (req.body.deleteTasks) {
            const taskIds = [
                ...project.taskIds,
                ...Object.values(project.sectionData).flatMap(section => section.taskIds)
            ];

            if (taskIds.length > 0) {
                await Task.deleteMany({ _id: { $in: taskIds }, userId });
            }
        }

        res.status(204).send({ id: req.params.id });
    });

    // Tasks

    router.get('/:id/tasks', async (req, res) => {
        const userId = getUserId(req);
        const project = await Project.findOne({ _id: req.params.id, userId }, { taskIds: true, sectionData: true });

        if (!project) throw new Error('Project is not found');

        const taskIds = [
            ...project.taskIds,
            ...Object.values(project.sectionData).flatMap(section => section.taskIds)
        ];

        const tasks = await Task.find({ _id: { $in: taskIds } });

        res.status(200).json(tasks);
    });

    // Sections

    router.post('/:id/sections', async (req, res) => {
        const userId = getUserId(req);
        const { name } = req.body;

        const sectionId = randomUUID();
        const project = await Project.findOneAndUpdate({ _id: req.params.id, userId }, {
            $push: { sectionIds: sectionId },
            $set: {
                [`sectionData.${sectionId}`]: {
                    id: sectionId,
                    name,
                    taskIds: []
                }
            }
        }, {
            returnDocument: 'after'
        });

        if (!project) throw new Error('Project is not found');

        res.status(201).json(project.sectionData[sectionId]);
    });

    router.put('/:id/sections/:sectionId', async (req, res) => {
        const { id, sectionId } = req.params;
        const userId = getUserId(req);
        const { name, taskIds } = req.body;

        const project = await Project.findOneAndUpdate({ _id: id, userId }, {
            $set: {
                [`sectionData.${sectionId}.name`]: name,
                [`sectionData.${sectionId}.taskIds`]: taskIds
            }
        }, {
            returnDocument: 'after'
        });

        if (!project) throw new Error('Project is not found');

        const section = project.sectionData[sectionId];

        res.status(200).json(section);
    });

    router.delete('/:id/sections/:sectionId', async (req, res) => {
        const { id, sectionId } = req.params;
        const userId = getUserId(req);

        const project = await Project.findOneAndUpdate({ _id: id, userId }, {
            $pull: { sectionIds: sectionId },
            $unset: { [`sectionData.${sectionId}`]: true }
        }, {
            returnDocument: 'before'
        });

        if (!project) throw new Error('Project is not found');

        const section = project.sectionData[sectionId];

        if (!section) throw new Error('Section is not found');

        await Task.deleteMany({ _id: { $in: section.taskIds }, userId });

        res.status(200).send(section);
    });

    return router;
};