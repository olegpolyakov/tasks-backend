import { beforeEach, describe, expect, it } from 'vitest';

import createTasksTools from '../../../src/ai/tools/tasks.ts';
import type Context from '../../../src/context.ts';

import { createContext, createModel, TaskModel } from './helpers.ts';


describe('task tools', () => {
    let Task: TaskModel;
    let context: Context;

    beforeEach(() => {
        Task = createModel();
        context = createContext({ Task });
    });

    it('counts tasks for the user', async () => {
        Task.countDocuments.mockResolvedValue(4);

        const tools = createTasksTools(context);
        const result = await tools.countTasks.call({ userId: 'user-1' });

        expect(Task.countDocuments).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(result).toBe('4');
    });

    it('lists task titles for the user', async () => {
        Task.find.mockResolvedValue([
            { title: 'Buy milk' },
            { title: 'Walk dog' }
        ]);

        const tools = createTasksTools(context);
        const result = await tools.listTasks.call({ userId: 'user-1' });

        expect(Task.find).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(result).toBe('Buy milk, Walk dog');
    });

    it('finds a task by title query for the user', async () => {
        Task.findOne.mockResolvedValue({
            toJSON: () => ({ id: 'task-1', title: 'Buy milk' })
        });

        const tools = createTasksTools(context);
        const result = await tools.findTask.call({ query: 'milk', userId: 'user-1' });

        expect(Task.findOne).toHaveBeenCalledWith({
            title: { $regex: 'milk', $options: 'i' },
            userId: 'user-1'
        });
        expect(result).toBe(JSON.stringify({ id: 'task-1', title: 'Buy milk' }));
    });

    it('gets a task by id for the user', async () => {
        Task.findOne.mockResolvedValue({
            toJSON: () => ({ id: 'task-1', title: 'Buy milk' })
        });

        const tools = createTasksTools(context);
        const result = await tools.getTask.call({ id: 'task-1', userId: 'user-1' });

        expect(Task.findOne).toHaveBeenCalledWith({ _id: 'task-1', userId: 'user-1' });
        expect(result).toBe(JSON.stringify({ id: 'task-1', title: 'Buy milk' }));
    });

    it('creates a task scoped to the user', async () => {
        Task.create.mockResolvedValue({
            toJSON: () => ({ id: 'task-1', title: 'Buy milk', userId: 'user-1' })
        });

        const tools = createTasksTools(context);
        const result = await tools.createTask.call({
            title: 'Buy milk',
            userId: 'user-1'
        });

        expect(Task.create).toHaveBeenCalledWith({ title: 'Buy milk', userId: 'user-1' });
        expect(result).toBe('Created ' + JSON.stringify({ id: 'task-1', title: 'Buy milk', userId: 'user-1' }));
    });

    it('updates a task for the user', async () => {
        Task.findOneAndUpdate.mockResolvedValue({
            toJSON: () => ({ id: 'task-1', title: 'Updated' })
        });

        const tools = createTasksTools(context);
        const result = await tools.updateTask.call({
            id: 'task-1',
            userId: 'user-1',
            data: { title: 'Updated' }
        });

        expect(Task.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'task-1', userId: 'user-1' }, { title: 'Updated' });
        expect(result).toBe('Updated ' + JSON.stringify({ id: 'task-1', title: 'Updated' }));
    });

    it('deletes a task for the user', async () => {
        Task.findOneAndDelete.mockResolvedValue({
            toJSON: () => ({ id: 'task-1' })
        });

        const tools = createTasksTools(context);
        const result = await tools.deleteTask.call({
            id: 'task-1',
            userId: 'user-1'
        });

        expect(Task.findOneAndDelete).toHaveBeenCalledWith({ _id: 'task-1', userId: 'user-1' });
        expect(result).toBe('Deleted ' + JSON.stringify({ id: 'task-1' }));
    });
});