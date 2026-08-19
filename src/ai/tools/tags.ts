import type { TagData } from '@olegpolyakov/tasks-core';

import type Context from '@/context.ts';

import { boolean, string, Tool } from '../lib.ts';

export default ({ models: { Tag, Task } }: Context) => {
    const countTags = new Tool(
        'countTags',
        'Get the number of tags',
        {
            'userId!': string('The ID of the user')
        },
        async ({ userId }: { userId: string }) => {
            const count = await Tag.countDocuments({ userId });

            return String(count);
        }
    );

    const listTags = new Tool(
        'listTags',
        'List tags',
        {
            'userId!': string('The ID of the user')
        },
        async ({ userId }: { userId: string }) => {
            const tags = await Tag.find({ userId });

            return tags.map(tag => tag.name).join(', ');
        }
    );

    const findTag = new Tool(
        'findTag',
        'Find tag by a query',
        {
            'query!': string('The query'),
            'userId!': string('The ID of the user')
        },
        async ({ query, userId }: { query: string; userId: string }) => {
            const tag = await Tag.findOne({
                name: { $regex: query, $options: 'i' },
                userId
            });

            if (!tag) throw new Error('Tag not found');

            return JSON.stringify(tag.toJSON());
        }
    );

    const getTag = new Tool(
        'getTag',
        'Get a tag by ID',
        {
            'id!': string('The ID of the tag'),
            'userId!': string('The ID of the user')
        },
        async ({ id, userId }: { id: string; userId: string }) => {
            const tag = await Tag.findOne({ _id: id, userId });

            if (!tag) throw new Error('Tag not found');

            return JSON.stringify(tag.toJSON());
        }
    );

    const createTag = new Tool(
        'createTag',
        'Create a new tag',
        {
            'name!': string('The name of the tag'),
            'userId!': string('The ID of the user')
        },
        async ({ userId, ...data }: TagData) => {
            const tag = await Tag.create({ ...data, userId });

            return 'Created ' + JSON.stringify(tag.toJSON());
        }
    );

    const updateTag = new Tool(
        'updateTag',
        'Update a tag',
        {
            'id!': string('The ID of the tag'),
            'userId!': string('The ID of the user'),
            'data!': {
                type: 'object',
                description: 'The data for tag',
                properties: {
                    name: string('The name of the tag'),
                    icon: string('The icon name or symbol for the tag')
                }
            }
        },
        async ({ id, userId, data }: { id: string; userId: string; data: Partial<TagData> }) => {
            const tag = await Tag.findOneAndUpdate({ _id: id, userId }, data, { returnDocument: 'after' });

            if (!tag) throw new Error('Tag not found');

            return 'Updated ' + JSON.stringify(tag.toJSON());
        }
    );

    const deleteTag = new Tool(
        'deleteTag',
        'Deletes a tag',
        {
            'id!': string('The ID of the tag'),
            'userId!': string('The ID of the user')
        },
        async ({ id, userId }: { id: string; userId: string }) => {
            const tag = await Tag.findOneAndDelete({ _id: id, userId }, { returnDocument: 'after' });

            if (!tag) throw new Error('Tag not found');

            await Task.updateMany({
                tagIds: id,
                userId
            }, {
                $pull: { tagIds: id }
            });

            return 'Deleted ' + JSON.stringify(tag.toJSON());
        }
    );

    return {
        countTags,
        listTags,
        findTag,
        getTag,
        createTag,
        updateTag,
        deleteTag
    };
};