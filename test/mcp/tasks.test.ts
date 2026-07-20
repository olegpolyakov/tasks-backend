import { beforeEach, describe, expect, it, vi } from 'vitest';

import type Context from '../../src/context.ts';
import type { Tool } from '../../src/mcp/lib.ts';
import createTasksSlice from '../../src/mcp/tasks.ts';

function createTaskModel() {
    return {
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        findByIdAndUpdate: vi.fn(),
        findByIdAndDelete: vi.fn()
    };
}

type TaskModel = ReturnType<typeof createTaskModel>;

function createContext(Task: TaskModel) {
    return { models: { Task } } as unknown as Context;
}

function getTool(tools: Tool[], name: string): Tool {
    const tool = tools.find(t => t.name === name);

    if (!tool) throw new Error(`Tool "${name}" not found`);

    return tool;
}

describe('tasks slice', () => {
    let Task: TaskModel;

    beforeEach(() => {
        Task = createTaskModel();
    });

    describe('list', () => {
        it('lists the user tasks as resources', async () => {
            Task.find.mockResolvedValue([
                { id: '1', title: 'Buy milk' },
                { id: '2', title: 'Walk dog' }
            ]);

            const slice = createTasksSlice(createContext(Task))('user-1');
            const resources = await slice.list();

            expect(Task.find).toHaveBeenCalledWith({ userId: 'user-1' });
            expect(resources).toEqual([
                { uri: 'tasks://1', name: 'Buy milk', mimeType: 'application/json' },
                { uri: 'tasks://2', name: 'Walk dog', mimeType: 'application/json' }
            ]);
        });
    });

    describe('read', () => {
        it('reads a task by id for the user', async () => {
            const populate = vi.fn().mockResolvedValue({ toJSON: () => ({ id: '1', title: 'Buy milk' }) });

            Task.findOne.mockReturnValue({ populate });

            const slice = createTasksSlice(createContext(Task))('user-1');
            const result = await slice.read('1');

            expect(Task.findOne).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
            expect(populate).toHaveBeenCalledWith('tags');
            expect(result).toEqual({ id: '1', title: 'Buy milk' });
        });

        it('throws when the task is not found', async () => {
            Task.findOne.mockReturnValue({ populate: vi.fn().mockResolvedValue(null) });

            const slice = createTasksSlice(createContext(Task))('user-1');

            await expect(slice.read('missing')).rejects.toThrow('Not found');
        });
    });

    describe('createTask tool', () => {
        it('creates a task scoped to the user', async () => {
            Task.create.mockResolvedValue({ id: '1', title: 'New task' });

            const slice = createTasksSlice(createContext(Task))('user-1');
            const tool = getTool(slice.tools, 'createTask');
            const result = await tool.execute({ data: { title: 'New task' } });

            expect(Task.create).toHaveBeenCalledWith({ title: 'New task', userId: 'user-1' });
            expect(result).toEqual({ id: '1', title: 'New task' });
        });
    });

    describe('updateTask tool', () => {
        it('updates an existing task', async () => {
            const populate = vi.fn().mockResolvedValue({ toObject: () => ({ id: '1', title: 'Updated' }) });

            Task.findByIdAndUpdate.mockReturnValue({ populate });

            const slice = createTasksSlice(createContext(Task))('user-1');
            const tool = getTool(slice.tools, 'updateTask');
            const result = await tool.execute({ id: '1', data: { title: 'Updated' } });

            expect(Task.findByIdAndUpdate).toHaveBeenCalledWith('1', { title: 'Updated' }, { new: true });
            expect(populate).toHaveBeenCalledWith('tags');
            expect(result).toEqual({ id: '1', title: 'Updated' });
        });

        it('throws when the task to update is not found', async () => {
            Task.findByIdAndUpdate.mockReturnValue({ populate: vi.fn().mockResolvedValue(null) });

            const slice = createTasksSlice(createContext(Task))('user-1');
            const tool = getTool(slice.tools, 'updateTask');

            await expect(tool.execute({ id: 'missing', data: {} })).rejects.toThrow('Task not found');
        });
    });

    describe('toggleTask tool', () => {
        it('toggles the completed state', async () => {
            const populate = vi.fn().mockResolvedValue({ toObject: () => ({ id: '1', completed: true }) });

            Task.findByIdAndUpdate.mockReturnValue({ populate });

            const slice = createTasksSlice(createContext(Task))('user-1');
            const tool = getTool(slice.tools, 'toggleTask');
            const result = await tool.execute({ id: '1', completed: true });

            expect(Task.findByIdAndUpdate).toHaveBeenCalledWith('1', { completed: true }, { new: true });
            expect(result).toEqual({ id: '1', completed: true });
        });

        it('throws when the task to toggle is not found', async () => {
            Task.findByIdAndUpdate.mockReturnValue({ populate: vi.fn().mockResolvedValue(null) });

            const slice = createTasksSlice(createContext(Task))('user-1');
            const tool = getTool(slice.tools, 'toggleTask');

            await expect(tool.execute({ id: 'missing', completed: true })).rejects.toThrow('Task not found');
        });
    });

    describe('deleteTask tool', () => {
        it('deletes a task by id', async () => {
            Task.findByIdAndDelete.mockResolvedValue({ id: '1' });

            const slice = createTasksSlice(createContext(Task))('user-1');
            const tool = getTool(slice.tools, 'deleteTask');

            await tool.execute({ id: '1' });

            expect(Task.findByIdAndDelete).toHaveBeenCalledWith('1');
        });
    });

    describe('taskDescription prompt', () => {
        it('generates a message for the given topic', () => {
            const slice = createTasksSlice(createContext(Task))('user-1');
            const prompt = slice.prompts.find(p => p.name === 'taskDescription');

            if (!prompt) throw new Error('Prompt "taskDescription" not found');

            const result = prompt.get({ topic: 'groceries' });

            expect(result).toEqual({
                messages: [{ role: 'user', content: 'Create a todo related to groceries' }]
            });
        });
    });
});
