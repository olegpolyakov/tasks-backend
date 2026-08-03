import { beforeEach, describe, expect, it, vi } from 'vitest';

import type Context from '../../src/context.ts';
import type { Slice } from '../../src/mcp/lib.ts';
import createTasksSlice from '../../src/mcp/slices/tasks.ts';
import { createModel } from '../helpers/models.ts';

import { getTool } from './helpers.ts';

describe('Tasks slice', () => {
    const Task = createModel();
    const context = { models: { Task } } as unknown as Context;
    let slice: Slice;

    beforeEach(() => {
        slice = createTasksSlice(context)('user-1');
        vi.resetAllMocks();
    });

    describe('list', () => {
        it('lists the user tasks as resources', async () => {
            Task.find.mockResolvedValue([
                { id: '1', title: 'Buy milk' },
                { id: '2', title: 'Walk dog' }
            ]);

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

            const result = await slice.read('1');

            expect(Task.findOne).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
            expect(populate).toHaveBeenCalledWith('tags');
            expect(result).toEqual({ id: '1', title: 'Buy milk' });
        });

        it('throws when the task is not found', async () => {
            Task.findOne.mockReturnValue({ populate: vi.fn().mockResolvedValue(null) });

            await expect(slice.read('missing')).rejects.toThrow('Not found');
        });
    });

    describe('createTask tool', () => {
        it('creates a task scoped to the user', async () => {
            Task.create.mockResolvedValue({ id: '1', title: 'New task' });

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

            const tool = getTool(slice.tools, 'updateTask');
            const result = await tool.execute({ id: '1', data: { title: 'Updated' } });

            expect(Task.findByIdAndUpdate).toHaveBeenCalledWith('1', { title: 'Updated' }, { new: true });
            expect(populate).toHaveBeenCalledWith('tags');
            expect(result).toEqual({ id: '1', title: 'Updated' });
        });

        it('throws when the task to update is not found', async () => {
            Task.findByIdAndUpdate.mockReturnValue({ populate: vi.fn().mockResolvedValue(null) });

            const tool = getTool(slice.tools, 'updateTask');

            await expect(tool.execute({ id: 'missing', data: {} })).rejects.toThrow('Task not found');
        });
    });

    describe('toggleTask tool', () => {
        it('toggles the completed state', async () => {
            Task.findByIdAndUpdate.mockReturnValue({
                populate: vi.fn().mockResolvedValue({ toObject: () => ({ id: '1', completed: true }) })
            });

            const tool = getTool(slice.tools, 'toggleTask');
            const result = await tool.execute({ id: '1', completed: true });

            expect(Task.findByIdAndUpdate).toHaveBeenCalledWith('1', { completed: true }, { new: true });
            expect(result).toEqual({ id: '1', completed: true });
        });

        it('throws when the task to toggle is not found', async () => {
            Task.findByIdAndUpdate.mockReturnValue({ populate: vi.fn().mockResolvedValue(null) });

            const slice = createTasksSlice(context)('user-1');
            const tool = getTool(slice.tools, 'toggleTask');

            await expect(tool.execute({ id: 'missing', completed: true })).rejects.toThrow('Task not found');
        });
    });

    describe('deleteTask tool', () => {
        it('deletes a task by id', async () => {
            Task.findByIdAndDelete.mockResolvedValue({ id: '1' });

            const tool = getTool(slice.tools, 'deleteTask');

            await tool.execute({ id: '1' });

            expect(Task.findByIdAndDelete).toHaveBeenCalledWith('1');
        });
    });

    describe('taskDescription prompt', () => {
        it('generates a message for the given topic', () => {
            const prompt = slice.prompts.find(p => p.name === 'taskDescription');

            if (!prompt) throw new Error('Prompt "taskDescription" not found');

            const result = prompt.get({ topic: 'groceries' });

            expect(result).toEqual({
                messages: [{ role: 'user', content: 'Create a todo related to groceries' }]
            });
        });
    });
});
