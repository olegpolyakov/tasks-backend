import { randomUUID } from 'node:crypto';

import { Router } from 'express';

import type Context from '@/context.ts';

export default ({
    models: { Project, Task }
}: Context) => {
    const router = Router();

    router.param('id', async (req, res, next, id) => {
        const project = await Project.findById(id, { _id: true });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        next();
    });

    router.get('/', async (req, res) => {
        const projects = await Project.find();

        res.status(200).json(projects);
    });

    router.get('/:id', async (req, res) => {
        const project = await Project.findById(req.params.id);

        res.status(200).json(project);
    });

    router.post('/', async (req, res) => {
        const project = await Project.create(req.body);

        res.status(201).json(project);
    });

    router.put('/:id', async (req, res) => {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });

        res.status(200).json(project);
    });

    router.delete('/:id', async (req, res) => {
        await Project.deleteOne({ _id: req.params.id });

        if (req.body.deleteTasks) {
            await Task.deleteMany({ projectIds: req.params.id });
        }

        res.status(204).send({ id: req.params.id });
    });

    // Tasks

    router.get('/:id/tasks', async (req, res) => {
        const project = await Project.findById(req.params.id, { taskIds: true, sectionData: true });

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
        const { name } = req.body;

        const sectionId = randomUUID();
        const project = await Project.findByIdAndUpdate(req.params.id, {
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
        const { name, taskIds } = req.body;

        const project = await Project.findByIdAndUpdate(id, {
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

        const project = await Project.findByIdAndUpdate(id, {
            $pull: { sectionIds: sectionId },
            $unset: { [`sectionData.${sectionId}`]: true }
        }, {
            returnDocument: 'before'
        });

        if (!project) throw new Error('Project is not found');

        const section = project.sectionData[sectionId];

        if (!section) throw new Error('Section is not found');

        await Task.deleteMany({ _id: { $in: section.taskIds } });

        res.status(200).send(section);
    });

    return router;
};