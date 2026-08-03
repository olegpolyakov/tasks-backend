import { beforeEach, describe, expect, it, vi } from 'vitest';

import type Context from '../../src/context.ts';
import type { Slice } from '../../src/mcp/lib.ts';
import createTagsSlice from '../../src/mcp/slices/tags.ts';
import { createModel } from '../helpers/models.ts';

import { getTool } from './helpers.ts';

describe('Tags slice', () => {
    const Tag = createModel();
    const context = { models: { Tag } } as unknown as Context;
    let slice: Slice;

    beforeEach(() => {
        slice = createTagsSlice(context)('user-1');
        vi.resetAllMocks();
    });

    describe('list', () => {
        it('lists the user tags as resources', async () => {
            Tag.find.mockResolvedValue([
                { id: '1', name: 'urgent' },
                { id: '2', name: 'home' }
            ]);

            const resources = await slice.list();

            expect(Tag.find).toHaveBeenCalledWith({ userId: 'user-1' });
            expect(resources).toEqual([
                { uri: 'tags://1', name: 'urgent', mimeType: 'application/json' },
                { uri: 'tags://2', name: 'home', mimeType: 'application/json' }
            ]);
        });
    });

    describe('read', () => {
        it('reads a tag by id for the user', async () => {
            Tag.findOne.mockResolvedValue({ toJSON: () => ({ id: '1', name: 'urgent' }) });

            const result = await slice.read('1');

            expect(Tag.findOne).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
            expect(result).toEqual({ id: '1', name: 'urgent' });
        });

        it('throws when the tag is not found', async () => {
            Tag.findOne.mockResolvedValue(null);

            await expect(slice.read('missing')).rejects.toThrow('Not found');
        });
    });

    describe('createTag tool', () => {
        it('creates a tag scoped to the user', async () => {
            Tag.create.mockResolvedValue({ id: '1', name: 'urgent' });

            const tool = getTool(slice.tools, 'createTag');
            const result = await tool.execute({ data: { name: 'urgent' } });

            expect(Tag.create).toHaveBeenCalledWith({ name: 'urgent', userId: 'user-1' });
            expect(result).toEqual({ id: '1', name: 'urgent' });
        });
    });

    describe('updateTag tool', () => {
        it('updates an existing tag', async () => {
            Tag.findOneAndUpdate.mockResolvedValue({ toObject: () => ({ id: '1', name: 'updated' }) });

            const tool = getTool(slice.tools, 'updateTag');
            const result = await tool.execute({ id: '1', data: { name: 'updated' } });

            expect(Tag.findOneAndUpdate).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' }, { name: 'updated' }, { new: true });
            expect(result).toEqual({ id: '1', name: 'updated' });
        });

        it('throws when the tag to update is not found', async () => {
            Tag.findOneAndUpdate.mockResolvedValue(null);

            const tool = getTool(slice.tools, 'updateTag');

            await expect(tool.execute({ id: 'missing', data: {} })).rejects.toThrow('Tag not found');
        });
    });

    describe('deleteTag tool', () => {
        it('deletes a tag by id', async () => {
            Tag.findOneAndDelete.mockResolvedValue({ id: '1' });

            const tool = getTool(slice.tools, 'deleteTag');

            await tool.execute({ id: '1' });

            expect(Tag.findOneAndDelete).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
        });
    });
});
