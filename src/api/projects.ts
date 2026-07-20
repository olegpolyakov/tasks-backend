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
        const { name, icon, description } = req.body;

        const project = await Project.create({
            name,
            icon,
            description
        });

        res.status(201).json(project);
    });

    router.put('/:id', async (req, res) => {
        const { name, icon, description } = req.body;

        const project = await Project.findByIdAndUpdate(req.params.id, {
            name,
            icon,
            description
        }, { new: true });

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
        const project = await Project.findById(req.params.id, { taskIds: true })
            .populate('tasks');

        res.status(200).json(project?.tasks);
    });

    // Sections

    router.post('/:id/sections', async (req, res) => {
        const { name } = req.body;

        const project = await Project.findById(req.params.id);
        const sectionId = randomUUID();

        project?.sectionIds.push(sectionId);
        project!.sectionData[sectionId] = {
            id: sectionId,
            name,
            taskIds: []
        };

        const updatedProject = await project?.save();

        res.status(201).json(updatedProject?.sectionData[sectionId]);
    });

    router.put('/:id/sections/:sectionId', async (req, res) => {
        const { name, taskIds } = req.body;

        const project = await Project.findById(req.params.id);
        const section = project?.sectionData[req.params.sectionId];

        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        section.name = name;
        section.taskIds = taskIds;

        await project?.save();

        res.status(200).json({ id: req.params.sectionId, name, taskIds });
    });

    router.delete('/:id/sections/:sectionId', async (req, res) => {
        const project = await Project.findById(req.params.id);

        if (!project?.sectionData[req.params.sectionId]) {
            return res.status(404).json({ message: 'Section not found' });
        }

        delete project?.sectionData[req.params.sectionId];
        project!.sectionIds = project.sectionIds.filter(id => id !== req.params.sectionId);

        await project?.save();

        res.status(204).send({ id: req.params.sectionId });
    });

    return router;
};