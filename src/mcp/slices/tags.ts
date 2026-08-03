import type { TagData } from '@olegpolyakov/tasks-core';

import type Context from '@/context.ts';

import { createTool, type Slice } from '../lib.ts';

export default ({ models: { Tag } }: Context) => (userId: string): Slice => ({
    async list() {
        const tags = await Tag.find({ userId });

        return tags.map(tag => ({
            uri: `tags://${tag.id}`,
            name: tag.name,
            mimeType: 'application/json'
        }));
    },

    async read(id: string) {
        const tag = await Tag.findOne({ _id: id, userId });

        if (!tag) throw new Error('Not found');

        return tag.toJSON();
    },

    tools: [
        createTool(
            'createTag',
            'Create a tag with the same fields used by the UI.',
            async ({ data }: { data: TagData }) => {
                return Tag.create({ ...data, userId });
            }
        ),

        createTool(
            'updateTag',
            'Update an existing tag by id.',
            async ({ id, data }: { id: string; data: TagData }) => {
                const tag = await Tag.findOneAndUpdate({ _id: id, userId }, data, { new: true });

                if (!tag) throw new Error('Tag not found');

                return tag.toObject();
            }
        ),

        createTool(
            'deleteTag',
            'Delete a tag by id.',
            async ({ id }: { id: string }) => {
                await Tag.findOneAndDelete({ _id: id, userId });
            }
        )
    ],

    prompts: []
});
