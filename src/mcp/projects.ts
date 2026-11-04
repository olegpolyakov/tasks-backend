import type { ProjectData } from '@olegpolyakov/tasks-core';
import { createTool } from '@olegpolyakov/backend/mcp';
import { array, boolean, object, string } from '@olegpolyakov/core/utils/schema';

import type { Context } from '@/context';

export default ({ models: { Project, Task } }: Context) => {
    const countProjects = createTool<{ userId: string }>(
        'countProjects',
        'Get the number of projects',
        {
            userId: string('The ID of the user')
        },
        async ({ userId }) => {
            const count = await Project.countDocuments({ userId });

            return String(count);
        }
    );

    const listProjects = createTool<{ userId: string }>(
        'listProjects',
        'List projects',
        {
            userId: string('The ID of the user')
        },
        async ({ userId }) => {
            const projects = await Project.find({ userId });

            return projects.map(project => project.name).join(', ');
        }
    );

    const findProject = createTool<{ query: string; userId: string }>(
        'findProject',
        'Find project by a query',
        {
            query: string('The query'),
            userId: string('The ID of the user')
        },
        async ({ query, userId }) => {
            const project = await Project.findOne({
                name: { $regex: query, $options: 'i' },
                userId
            });

            if (!project) throw new Error('Project not found');

            return JSON.stringify(project.toJSON());
        }
    );

    const getProject = createTool<{ id: string; userId: string }>(
        'getProject',
        'Get a project by ID',
        {
            id: string('The ID of the project'),
            userId: string('The ID of the user')
        },
        async ({ id, userId }) => {
            const project = await Project.get({ _id: id, userId });

            return JSON.stringify(project.toJSON());
        }
    );

    const createProject = createTool<ProjectData>(
        'createProject',
        'Create a new project',
        {
            name: string('The name of the project'),
            userId: string('The ID of the user')
        },
        async ({ userId, ...data }) => {
            const project = await Project.create({ ...data, userId });

            return 'Created ' + JSON.stringify(project.toJSON());
        }
    );

    const updateProject = createTool<{
        id: string;
        userId: string;
        data: Partial<ProjectData>
    }>(
        'updateProject',
        'Update a project',
        {
            id: string('The ID of the project'),
            userId: string('The ID of the user'),
            data: object({
                name: string('The name of the project'),
                description: string('The short description of the project'),
                content: string('The detailed markdown or plaintext body content of the project'),
                icon: string('The icon name or symbol for the project'),
                taskIds: array('string', 'Array of task identifier strings attached to the project root'),
                sectionIds: array('string', 'Array of project section identifier strings')
            }, 'The data for project')
        },
        async ({ id, userId, data }) => {
            const project = await Project.update({ _id: id, userId }, data);

            return 'Updated ' + JSON.stringify(project.toJSON());
        }
    );

    const deleteProject = createTool<{
        id: string;
        userId: string;
        deleteTasks?: string
    }>(
        'deleteProject',
        'Deletes a project',
        {
            id: string('The ID of the project'),
            userId: string('The ID of the user'),
            deleteTasks: boolean('Delete tasks connected to the project')
        },
        async ({ id, userId, deleteTasks }) => {
            const project = await Project.delete({ _id: id, userId });

            if (deleteTasks) {
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