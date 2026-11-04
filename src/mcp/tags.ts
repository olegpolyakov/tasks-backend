import type { TagData } from '@olegpolyakov/tasks-core';
import { createTool } from '@olegpolyakov/backend/mcp';
import { object, string } from '@olegpolyakov/core/utils/schema';

import type { Context } from '@/context';

export default ({ models: { Tag, Task } }: Context) => {
    const countTags = createTool<{ userId: string }>(
        'countTags',
        'Get the number of tags',
        {
            userId: string('The ID of the user')
        },
        async ({ userId }) => {
            const count = await Tag.countDocuments({ userId });

            return String(count);
        }
    );

    const listTags = createTool<{ userId: string }>(
        'listTags',
        'List tags',
        {
            userId: string('The ID of the user')
        },
        async ({ userId }) => {
            const tags = await Tag.find({ userId });

            return tags.map(tag => tag.name).join(', ');
        }
    );

    const findTag = createTool<{ query: string; userId: string }>(
        'findTag',
        'Find tag by a query',
        {
            query: string('The query'),
            userId: string('The ID of the user')
        },
        async ({ query, userId }) => {
            const tag = await Tag.findOne({
                name: { $regex: query, $options: 'i' },
                userId
            });

            if (!tag) throw new Error('Tag not found');

            return JSON.stringify(tag.toJSON());
        }
    );

    const getTag = createTool<{ id: string; userId: string }>(
        'getTag',
        'Get a tag by ID',
        {
            id: string('The ID of the tag'),
            userId: string('The ID of the user')
        },
        async ({ id, userId }) => {
            const tag = await Tag.get({ _id: id, userId });

            return JSON.stringify(tag.toJSON());
        }
    );

    const createTag = createTool<TagData>(
        'createTag',
        'Create a new tag',
        {
            name: string('The name of the tag'),
            userId: string('The ID of the user')
        },
        async ({ userId, ...data }) => {
            const tag = await Tag.create({ ...data, userId });

            return 'Created ' + JSON.stringify(tag.toJSON());
        }
    );

    const updateTag = createTool<{
        id: string;
        userId: string;
        data: Partial<TagData>
    }>(
        'updateTag',
        'Update a tag',
        {
            id: string('The ID of the tag'),
            userId: string('The ID of the user'),
            data: object({
                name: string('The name of the tag'),
                icon: string('The icon name or symbol for the tag')
            }, 'The data for tag')
        },
        async ({ id, userId, data }) => {
            const tag = await Tag.update({ _id: id, userId }, data);

            return 'Updated ' + JSON.stringify(tag.toJSON());
        }
    );

    const deleteTag = createTool<{ id: string; userId: string }>(
        'deleteTag',
        'Deletes a tag',
        {
            id: string('The ID of the tag'),
            userId: string('The ID of the user')
        },
        async ({ id, userId }) => {
            const tag = await Tag.delete({ _id: id, userId });

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