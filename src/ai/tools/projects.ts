import type { ProjectData } from '@olegpolyakov/tasks-core';

import type Context from '@/context.ts';

import { array, object, string, Tool } from '../lib.ts';

export default ({ models: { Project, Task } }: Context) => {
    const countProjects = new Tool(
        'countProjects',
        'Get the number of projects',
        {
            'userId!': string('The ID of the user')
        },
        async ({ userId }: { userId: string }) => {
            const count = await Project.countDocuments({ userId });

            return String(count);
        }
    );

    const listProjects = new Tool(
        'listProjects',
        'List projects',
        {
            'userId!': string('The ID of the user')
        },
        async ({ userId }: { userId: string }) => {
            const projects = await Project.find({ userId });

            return projects.map(project => project.name).join(', ');
        }
    );

    const findProject = new Tool(
        'findProject',
        'Find project by a query',
        {
            'query!': string('The query'),
            'userId!': string('The ID of the user')
        },
        async ({ query, userId }: { query: string; userId: string }) => {
            const project = await Project.findOne({
                name: { $regex: query, $options: 'i' },
                userId
            });

            if (!project) throw new Error('Project not found');

            return JSON.stringify(project.toJSON());
        }
    );

    const getProject = new Tool(
        'getProject',
        'Get a project by ID',
        {
            'id!': string('The ID of the project'),
            'userId!': string('The ID of the user')
        },
        async ({ id, userId }: { id: string; userId: string }) => {
            const project = await Project.findOne({ _id: id, userId });

            if (!project) throw new Error('Project not found');

            return JSON.stringify(project.toJSON());
        }
    );

    const createProject = new Tool(
        'createProject',
        'Create a new project',
        {
            'name!': string('The name of the project'),
            'userId!': string('The ID of the user')
        },
        async ({ userId, ...data }: ProjectData) => {
            const project = await Project.create({ ...data, userId });

            return 'Created ' + JSON.stringify(project.toJSON());
        }
    );

    const updateProject = new Tool(
        'updateProject',
        'Update a project',
        {
            'id!': string('The ID of the project'),
            'userId!': string('The ID of the user'),
            'data!': object('The data for project', {
                name: string('The name of the project'),
                description: string('The short description of the project'),
                content: string('The detailed markdown or plaintext body content of the project'),
                icon: string('The icon name or symbol for the project'),
                taskIds: array('Array of task identifier strings attached to the project root', 'string', {
                    uniqueItems: true
                }),
                sectionIds: array('Array of project section identifier strings', 'string', {
                    uniqueItems: true
                })
            })
        },
        async ({ id, userId, data }: { id: string; userId: string; data: Partial<ProjectData> }) => {
            const project = await Project.findOneAndUpdate({ _id: id, userId }, data, { returnDocument: 'after' });

            if (!project) throw new Error('Project not found');

            return 'Updated ' + JSON.stringify(project.toJSON());
        }
    );

    const deleteProject = new Tool(
        'deleteProject',
        'Deletes a project',
        {
            'id!': string('The ID of the project'),
            'userId!': string('The ID of the user'),
            deleteTasks: string('Delete tasks connected to the project', {
                enum: ['true', 'false']
            })
        },
        async ({ id, userId, deleteTasks }: { id: string; userId: string; deleteTasks?: string }) => {
            const project = await Project.findOneAndDelete({ _id: id, userId }, { returnDocument: 'after' });

            if (!project) throw new Error('Project not found');

            if (deleteTasks === 'true') {
                const taskIds = [
                    ...project.taskIds,
                    ...Object.values(project.sectionData ?? {}).flatMap(section => section.taskIds)
                ];

                if (taskIds.length > 0) {
                    await Task.deleteMany({ _id: { $in: taskIds }, userId });
                }
            }

            return 'Deleted ' + JSON.stringify(project.toJSON());
        }
    );

    return {
        countProjects,
        listProjects,
        findProject,
        getProject,
        createProject,
        updateProject,
        deleteProject
    };
};