import type { ProjectData } from '@olegpolyakov/tasks-core';

import type Context from '@/context.ts';

import { createTool, type Slice } from '../lib.ts';

export default ({ models: { Project } }: Context) => (userId: string): Slice => ({
    async list() {
        const projects = await Project.find({ userId });

        return projects.map(project => ({
            uri: `projects://${project.id}`,
            name: project.name,
            mimeType: 'application/json'
        }));
    },

    async read(id: string) {
        const project = await Project.findOne({ _id: id, userId });

        if (!project) throw new Error('Not found');

        return project.toJSON();
    },

    tools: [
        createTool(
            'createProject',
            'Create a project with the same fields used by the UI.',
            async ({ data }: { data: ProjectData }) => {
                return Project.create({ ...data, userId });
            }
        ),

        createTool(
            'updateProject',
            'Update an existing project by id.',
            async ({ id, data }: { id: string; data: ProjectData }) => {
                const project = await Project.findOneAndUpdate({ _id: id, userId }, data, { new: true });

                if (!project) throw new Error('Project not found');

                return project.toObject();
            }
        ),

        createTool(
            'deleteProject',
            'Delete a project by id.',
            async ({ id }: { id: string }) => {
                await Project.findOneAndDelete({ _id: id, userId });
            }
        )
    ],

    prompts: []
});
