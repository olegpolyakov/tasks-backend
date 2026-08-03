import { beforeEach, describe, expect, it, vi } from 'vitest';

import createProjectsTools from '../../src/ai/tools/projects.ts';
import type Context from '../../src/context.ts';

function createProjectModel() {
    return {
        countDocuments: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn()
    };
}

function createTaskModel() {
    return {
        deleteMany: vi.fn()
    };
}

type ProjectModel = ReturnType<typeof createProjectModel>;
type TaskModel = ReturnType<typeof createTaskModel>;

function createContext(Project: ProjectModel, Task: TaskModel) {
    return {
        models: {
            Project,
            Task
        }
    } as unknown as Context;
}

describe('project tools', () => {
    let Project: ProjectModel;
    let Task: TaskModel;

    beforeEach(() => {
        Project = createProjectModel();
        Task = createTaskModel();
    });

    it('counts projects for the user', async () => {
        Project.countDocuments.mockResolvedValue(3);

        const tools = createProjectsTools(createContext(Project, Task));
        const result = await tools.countProjects.call({ userId: 'user-1' });

        expect(Project.countDocuments).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(result).toBe('3');
    });

    it('lists project names for the user', async () => {
        Project.find.mockResolvedValue([
            { name: 'Inbox' },
            { name: 'Roadmap' }
        ]);

        const tools = createProjectsTools(createContext(Project, Task));
        const result = await tools.listProjects.call({ userId: 'user-1' });

        expect(Project.find).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(result).toBe('Inbox, Roadmap');
    });

    it('finds a project by name query for the user', async () => {
        Project.findOne.mockResolvedValue({
            toJSON: () => ({ id: 'project-1', name: 'Inbox' })
        });

        const tools = createProjectsTools(createContext(Project, Task));
        const result = await tools.findProject.call({ query: 'inb', userId: 'user-1' });

        expect(Project.findOne).toHaveBeenCalledWith({
            name: { $regex: 'inb', $options: 'i' },
            userId: 'user-1'
        });
        expect(result).toBe(JSON.stringify({ id: 'project-1', name: 'Inbox' }));
    });

    it('gets a project by id for the user', async () => {
        Project.findOne.mockResolvedValue({
            toJSON: () => ({ id: 'project-1', name: 'Inbox' })
        });

        const tools = createProjectsTools(createContext(Project, Task));
        const result = await tools.getProject.call({ id: 'project-1', userId: 'user-1' });

        expect(Project.findOne).toHaveBeenCalledWith({ _id: 'project-1', userId: 'user-1' });
        expect(result).toBe(JSON.stringify({ id: 'project-1', name: 'Inbox' }));
    });

    it('creates a project scoped to the user', async () => {
        Project.create.mockResolvedValue({
            toJSON: () => ({ id: 'project-1', name: 'Inbox', userId: 'user-1' })
        });

        const tools = createProjectsTools(createContext(Project, Task));
        const result = await tools.createProject.call({
            name: 'Inbox',
            userId: 'user-1'
        });

        expect(Project.create).toHaveBeenCalledWith({ name: 'Inbox', userId: 'user-1' });
        expect(result).toBe('Created ' + JSON.stringify({ id: 'project-1', name: 'Inbox', userId: 'user-1' }));
    });

    it('updates a project for the user', async () => {
        Project.findOneAndUpdate.mockResolvedValue({
            toJSON: () => ({ id: 'project-1', name: 'Updated' })
        });

        const tools = createProjectsTools(createContext(Project, Task));
        const result = await tools.updateProject.call({
            id: 'project-1',
            userId: 'user-1',
            data: { name: 'Updated' }
        });

        expect(Project.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'project-1', userId: 'user-1' }, { name: 'Updated' });
        expect(result).toBe('Updated ' + JSON.stringify({ id: 'project-1', name: 'Updated' }));
    });

    it('deletes a project and optionally deletes connected tasks', async () => {
        Project.findOneAndDelete.mockResolvedValue({
            taskIds: ['task-1'],
            sectionData: {
                sectionA: {
                    id: 'sectionA',
                    name: 'Section A',
                    taskIds: ['task-2']
                }
            },
            toJSON: () => ({ id: 'project-1' })
        });

        const tools = createProjectsTools(createContext(Project, Task));
        const result = await tools.deleteProject.call({
            id: 'project-1',
            userId: 'user-1',
            deleteTasks: 'true'
        });

        expect(Project.findOneAndDelete).toHaveBeenCalledWith({ _id: 'project-1', userId: 'user-1' });
        expect(Task.deleteMany).toHaveBeenCalledWith({
            _id: { $in: ['task-1', 'task-2'] },
            userId: 'user-1'
        });
        expect(result).toBe('Deleted ' + JSON.stringify({ id: 'project-1' }));
    });
});