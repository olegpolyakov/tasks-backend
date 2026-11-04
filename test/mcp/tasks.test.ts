import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockModel } from '@olegpolyakov/backend/test/mocks/models';

import type { Context } from '@/context';
import createTaskTools from '@/mcp/tasks';

describe('Tasks tools', () => {
    const Task = mockModel();

    const context = {
        config: {},
        models: {
            Task
        }
    } as unknown as Context;
    const {
        countTasks,
        listTasks,
        findTask,
        getTask,
        createTask,
        updateTask,
        deleteTask
    } = createTaskTools(context);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('countTasks tool', () => {
        it('counts tasks scoped to the user', async () => {
            Task.countDocuments.mockResolvedValue(2);

            const result = await countTasks.call({ userId: 'user-1' });

            expect(result).toBe('2');
            expect(Task.countDocuments).toHaveBeenCalledWith({ userId: 'user-1' });
        });
    });

    describe('listTasks tool', () => {
        it('lists task titles scoped to the user', async () => {
            Task.find.mockResolvedValue([
                { title: 'Buy milk' },
                { title: 'Walk dog' }
            ]);

            const result = await listTasks.call({ userId: 'user-1' });

            expect(result).toBe('Buy milk, Walk dog');
            expect(Task.find).toHaveBeenCalledWith({ userId: 'user-1' });
        });
    });

    describe('findTask tool', () => {
        it('finds a task by a case-insensitive title query for the user', async () => {
            Task.findOne.mockResolvedValue({
                toJSON: () => ({ id: '1', title: 'Buy milk' })
            });

            const result = await findTask.call({ query: 'milk', userId: 'user-1' });

            expect(result).toBe(JSON.stringify({ id: '1', title: 'Buy milk' }));
            expect(Task.findOne).toHaveBeenCalledWith({
                title: { $regex: 'milk', $options: 'i' },
                userId: 'user-1'
            });
        });

        it('throws when the task is not found', async () => {
            Task.findOne.mockResolvedValue(null);

            await expect(findTask.call({ query: 'missing', userId: 'user-1' }))
                .rejects.toThrow('Task not found');
        });
    });

    describe('getTask tool', () => {
        it('gets a task by id scoped to the user', async () => {
            Task.findOne.mockResolvedValue({
                toJSON: () => ({ id: '1', title: 'Buy milk' })
            });

            const result = await getTask.call({ id: '1', userId: 'user-1' });

            expect(result).toBe(JSON.stringify({ id: '1', title: 'Buy milk' }));
            expect(Task.findOne).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
        });

        it('throws when the task is not found', async () => {
            Task.findOne.mockResolvedValue(null);

            await expect(getTask.call({ id: 'missing', userId: 'user-1' }))
                .rejects.toThrow('Task not found');
        });
    });

    describe('createTask tool', () => {
        it('creates a task scoped to the user', async () => {
            Task.create.mockResolvedValue({
                toJSON: () => ({ id: '1', title: 'Buy milk', userId: 'user-1' })
            });

            const result = await createTask.call({ title: 'Buy milk', userId: 'user-1' });

            expect(result).toBe('Created ' + JSON.stringify({ id: '1', title: 'Buy milk', userId: 'user-1' }));
            expect(Task.create).toHaveBeenCalledWith({ title: 'Buy milk', userId: 'user-1' });
        });
    });

    describe('updateTask tool', () => {
        it('updates an existing task', async () => {
            Task.findOneAndUpdate.mockResolvedValue({
                toJSON: () => ({ id: '1', title: 'Updated' })
            });

            const result = await updateTask.call({
                id: '1',
                userId: 'user-1',
                data: { title: 'Updated' }
            });

            expect(result).toBe('Updated ' + JSON.stringify({ id: '1', title: 'Updated' }));
            expect(Task.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '1', userId: 'user-1' },
                { title: 'Updated' },
                { returnDocument: 'after' }
            );
        });

        it('throws when the task to update is not found', async () => {
            Task.findOneAndUpdate.mockResolvedValue(null);

            await expect(updateTask.call({
                id: 'missing',
                userId: 'user-1',
                data: {}
            })).rejects.toThrow('Task not found');
        });
    });

    describe('deleteTask tool', () => {
        it('deletes a task scoped to the user', async () => {
            Task.findOneAndDelete.mockResolvedValue({
                toJSON: () => ({ id: '1', title: 'Buy milk' })
            });

            const result = await deleteTask.call({ id: '1', userId: 'user-1' });

            expect(result).toBe('Deleted ' + JSON.stringify({ id: '1', title: 'Buy milk' }));
            expect(Task.findOneAndDelete).toHaveBeenCalledWith(
                { _id: '1', userId: 'user-1' },
                { returnDocument: 'after' }
            );
        });

        it('throws when the task is not found', async () => {
            Task.findOneAndDelete.mockResolvedValue(null);

            await expect(deleteTask.call({ id: 'missing', userId: 'user-1' }))
                .rejects.toThrow('Task not found');
        });
    });
});
