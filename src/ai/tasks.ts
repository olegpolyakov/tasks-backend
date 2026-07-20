import type { TaskData } from '@olegpolyakov/tasks-core';

import type Context from '@/context.ts';

import { array, boolean, integer, object, string, Tool } from './lib.ts';

export default ({ models: { Task } }: Context) => {
    const countTasks = new Tool(
        'countTasks',
        'Get the number of tasks',
        {
            'userId!': string('The ID of the user')
        },
        async ({ userId }: {userId: string}) => {
            const count = Task.countDocuments({ userId });
    
            return String(count);
        }
    );

    const listTasks = new Tool(
        'listTasks',
        'List tasks',
        {
            'userId!': string('The ID of the user')
        },
        async ({ userId }: {userId: string}) => {
            const tasks = await Task.find({ userId });
    
            return tasks.map(t => t.title).join(', ');
        }
    );

    const findTask = new Tool(
        'findTask',
        'Find task by a query',
        {
            'query!': string('The query'),
            'userId!': string('The ID of the user')
        },
        async ({ query, userId }: { query: string; userId: string }) => {
            const task = await Task.findOne({
                title: { $regex: query, $options: 'i' },
                userId
            });
    
            if (!task) throw new Error('Task not found');
    
            return JSON.stringify(task?.toJSON());
        }
    );
            
    const getTask = new Tool(
        'getTask',
        'Get a task by ID',
        {
            'id!': string('The ID of the task'),
            'userId!': string('The ID of the user')
        },
        async ({ id, userId }: { id: string; userId: string; }) => {
            const task = await Task.findOne({ _id: id, userId });
    
            if (!task) throw new Error('Task not found');
    
            return JSON.stringify(task?.toJSON());
        }
    );

    const createTask = new Tool(
        'createTask',
        'Create a new task',
        {
            'title!': string('The title of the task'),
            'userId!': string('The ID of the user')
        },
        async (data: TaskData) => {
            const task = await Task.create(data);
            return 'Created ' + JSON.stringify(task.toJSON());
        }
    );

    const updateTask = new Tool(
        'updateTask',
        'Update a task',
        {
            'id!': string('The ID of the task'),
            'userId!': string('The ID of the user'),
            'data!': object('The data for task', {
                title: string('The title of the task'),
                completed: boolean('The execution status of the task'),
                dueDate: string('The deadline timestamp in ISO 8601 string format', {
                    format: 'date-time'
                }),
                recurrence: object('Recurrence configuration patterns for repeating tasks', {
                    'frequency!': string('How often the task repeats', {
                        enum: ['daily', 'weekly', 'monthly', 'yearly']
                    }),
                    interval: integer('The interval sequence of the recurrence', {
                        minimum: 1
                    })
                }),
                content: string('The detailed markdown or plaintext body content of the task'),
                tagIds: array('Array of connected label or tag identifier strings', 'string', {
                    uniqueItems: true
                }),
                childrenIds: array('Array of sub-task or dependent child identifier strings', 'string', {
                    uniqueItems: true
                })
            })
        },
        async ({ id, userId, data }: { id: string; userId: string; data: TaskData }) => {
            const task = await Task.findOneAndUpdate({ _id: id, userId }, data);

            if (!task) throw new Error('Task not found');

            return 'Updated ' + JSON.stringify(task.toJSON());
        }
    );

    const deleteTask = new Tool(
        'deleteTask',
        'Deletes a task',
        {
            'id!': string('The ID of the task'),
            'userId!': string('The ID of the user')
        },
        async ({ id, userId }: { id: string; userId: string; }) => {
            const task = await Task.findOneAndDelete({ _id: id, userId });

            if (!task) throw new Error('Task not found');

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