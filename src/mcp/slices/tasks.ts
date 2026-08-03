import type { TaskData } from '@olegpolyakov/tasks-core';

import type Context from '@/context.ts';

import { createPrompt, createTool, type Slice } from '../lib.ts';

export default ({ models: { Task } }: Context) => (userId: string): Slice => ({
    async list() {
        const tasks = await Task.find({ userId });
    
        return tasks.map(task => ({
            uri: `tasks://${task.id}`,
            name: task.title,
            mimeType: 'application/json'
        }));
    },

    async read(id: string) {
        const task = await Task.findOne({ _id: id, userId }).populate('tags');

        if (!task) throw new Error('Not found');

        return task.toJSON();
    },
    
    tools: [
        createTool(
            'createTask',
            'Create a task with the same fields used by the UI.',
            async ({ data }: { data: TaskData }) => {
                return Task.create({ ...data, userId });
            }
        ),
    
        createTool(
            'updateTask',
            'Update an existing task by id.',
            async ({ id, data }: { id: string, data: TaskData }) => {
                const task = await Task.findByIdAndUpdate(id, data, { new: true })
                    .populate('tags');

                if (!task) throw new Error('Task not found');

                return task.toObject();
            }
        ),

        createTool(
            'toggleTask',
            'Set a task completed state.',
            async ({ id, completed }: { id: string; completed: boolean }) => {
                const task = await Task.findByIdAndUpdate(id, {
                    completed
                }, { new: true }).populate('tags');

                if (!task) throw new Error('Task not found');

                return task.toObject();
            }
        ),

        createTool(
            'deleteTask',
            'Delete a task by id.',
            async ({ id } : { id: string }) => {
                await Task.findByIdAndDelete(id);
            }
        )
    ],

    prompts: [
        createPrompt(
            'taskDescription',
            'Generate a task description template',
            [{ name: 'topic', type: 'string' }],
            args => ({
                messages: [
                    {
                        role: 'user',
                        content: `Create a todo related to ${args.topic}`
                    }
                ]
            })
        )
    ]
});