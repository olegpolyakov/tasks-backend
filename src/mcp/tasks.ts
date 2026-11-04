import type { TaskData } from '@olegpolyakov/tasks-core';
import { createTool } from '@olegpolyakov/backend/mcp';
import { array, boolean, integer, object, string } from '@olegpolyakov/core/utils/schema';

import type { Context } from '@/context';

export default ({ models: { Task } }: Context) => {
    const countTasks = createTool<{ userId: string }>(
        'countTasks',
        'Get the number of tasks',
        {
            userId: string('The ID of the user')
        },
        async ({ userId }) => {
            const count = await Task.countDocuments({ userId });
    
            return String(count);
        }
    );

    const listTasks = createTool<{ userId: string }>(
        'listTasks',
        'List tasks',
        {
            userId: string('The ID of the user')
        },
        async ({ userId }) => {
            const tasks = await Task.find({ userId });
    
            return tasks.map(t => t.title).join(', ');
        }
    );

    const findTask = createTool<{ query: string; userId: string }>(
        'findTask',
        'Find task by a query',
        {
            query: string('The query'),
            userId: string('The ID of the user')
        },
        async ({ query, userId }) => {
            const task = await Task.findOne({
                title: { $regex: query, $options: 'i' },
                userId
            });
    
            if (!task) throw new Error('Task not found');
    
            return JSON.stringify(task?.toJSON());
        }
    );
            
    const getTask = createTool<{ id: string; userId: string; }>(
        'getTask',
        'Get a task by ID',
        {
            id: string('The ID of the task'),
            userId: string('The ID of the user')
        },
        async ({ id, userId }) => {
            const task = await Task.get({ _id: id, userId });
    
            return JSON.stringify(task?.toJSON());
        }
    );

    const createTask = createTool<TaskData>(
        'createTask',
        'Create a new task',
        {
            title: string('The title of the task'),
            userId: string('The ID of the user')
        },
        async data => {
            const task = await Task.create(data);
            
            return 'Created ' + JSON.stringify(task.toJSON());
        }
    );

    const updateTask = createTool<{
        id: string;
        userId: string;
        data: TaskData
    }>(
        'updateTask',
        'Update a task',
        {
            'id!': string('The ID of the task'),
            'userId!': string('The ID of the user'),
            'data!': object({
                title: string('The title of the task'),
                completed: boolean('The execution status of the task'),
                important: boolean('Whether the task is marked as important or high priority'),
                date: string('The deadline timestamp in ISO 8601 string format', {
                    format: 'date-time'
                }),
                recurrence: object({
                    frequency: string('How often the task repeats', {
                        enum: ['daily', 'weekly', 'monthly', 'yearly']
                    }),
                    interval: integer('The interval sequence of the recurrence', {
                        minimum: 1
                    })
                }, 'Recurrence configuration patterns for repeating tasks'),
                content: string('The detailed markdown or plaintext body content of the task'),
                tagIds: array('string', 'Array of connected label or tag identifier strings'),
                childrenIds: array('string', 'Array of sub-task or dependent child identifier strings')
            }, 'The data for task')
        },
        async ({ id, userId, data }) => {
            const task = await Task.update({ _id: id, userId }, data);

            return 'Updated ' + JSON.stringify(task.toJSON());
        }
    );

    const deleteTask = createTool<{ id: string; userId: string; }>(
        'deleteTask',
        'Deletes a task',
        {
            id: string('The ID of the task'),
            userId: string('The ID of the user')
        },
        async ({ id, userId }) => {
            const task = await Task.delete({ _id: id, userId });

            return 'Deleted ' + JSON.stringify(task.toJSON());
        }
    );

    return {
        countTasks,
        listTasks,
        findTask,
        getTask,
        createTask,
        updateTask,
        deleteTask
    };
};