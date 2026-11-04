import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockModel } from '@olegpolyakov/backend/test/mocks/models';

import type { Context } from '@/context';
import createTagTools from '@/mcp/tags';

describe('Tags tools', () => {
    const Tag = mockModel();
    const Task = mockModel();

    const context = {
        config: {},
        models: {
            Tag,
            Task
        }
    } as unknown as Context;
    const {
        countTags,
        listTags,
        findTag,
        getTag,
        createTag,
        updateTag,
        deleteTag
    } = createTagTools(context);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('countTags tool', () => {
        it('counts tags scoped to the user', async () => {
            Tag.countDocuments.mockResolvedValue(2);

            const result = await countTags.call({ userId: 'user-1' });

            expect(result).toBe('2');
            expect(Tag.countDocuments).toHaveBeenCalledWith({ userId: 'user-1' });
        });
    });

    describe('listTags tool', () => {
        it('lists tag names scoped to the user', async () => {
            Tag.find.mockResolvedValue([
                { name: 'urgent' },
                { name: 'home' }
            ]);

            const result = await listTags.call({ userId: 'user-1' });

            expect(result).toBe('urgent, home');
            expect(Tag.find).toHaveBeenCalledWith({ userId: 'user-1' });
        });
    });

    describe('findTag tool', () => {
        it('finds a tag by a case-insensitive name query for the user', async () => {
            Tag.findOne.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'urgent' })
            });

            const result = await findTag.call({ query: 'urgent', userId: 'user-1' });

            expect(result).toBe(JSON.stringify({ id: '1', name: 'urgent' }));
            expect(Tag.findOne).toHaveBeenCalledWith({
                name: { $regex: 'urgent', $options: 'i' },
                userId: 'user-1'
            });
        });

        it('throws when the tag is not found', async () => {
            Tag.findOne.mockResolvedValue(null);

            await expect(findTag.call({ query: 'missing', userId: 'user-1' }))
                .rejects.toThrow('Tag not found');
        });
    });

    describe('getTag tool', () => {
        it('gets a tag by id scoped to the user', async () => {
            Tag.findOne.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'urgent' })
            });

            const result = await getTag.call({ id: '1', userId: 'user-1' });

            expect(result).toBe(JSON.stringify({ id: '1', name: 'urgent' }));
            expect(Tag.findOne).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
        });

        it('throws when the tag is not found', async () => {
            Tag.findOne.mockResolvedValue(null);

            await expect(getTag.call({ id: 'missing', userId: 'user-1' }))
                .rejects.toThrow('Tag not found');
        });
    });

    describe('createTag tool', () => {
        it('creates a tag scoped to the user', async () => {
            Tag.create.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'urgent', userId: 'user-1' })
            });

            const result = await createTag.call({ name: 'urgent', userId: 'user-1' });

            expect(result).toBe('Created ' + JSON.stringify({ id: '1', name: 'urgent', userId: 'user-1' }));
            expect(Tag.create).toHaveBeenCalledWith({ name: 'urgent', userId: 'user-1' });
        });
    });

    describe('updateTag tool', () => {
        it('updates an existing tag', async () => {
            Tag.findOneAndUpdate.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'updated' })
            });

            const result = await updateTag.call({
                id: '1',
                userId: 'user-1',
                data: { name: 'updated' }
            });

            expect(result).toBe('Updated ' + JSON.stringify({ id: '1', name: 'updated' }));
            expect(Tag.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '1', userId: 'user-1' },
                { name: 'updated' },
                { returnDocument: 'after' }
            );
        });

        it('throws when the tag to update is not found', async () => {
            Tag.findOneAndUpdate.mockResolvedValue(null);

            await expect(updateTag.call({
                id: 'missing',
                userId: 'user-1',
                data: {}
            })).rejects.toThrow('Tag not found');
        });
    });

    describe('deleteTag tool', () => {
        it('deletes a tag scoped to the user and removes it from tasks', async () => {
            Tag.findOneAndDelete.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'urgent' })
            });

            const result = await deleteTag.call({ id: '1', userId: 'user-1' });

            expect(result).toBe('Deleted ' + JSON.stringify({ id: '1', name: 'urgent' }));
            expect(Tag.findOneAndDelete).toHaveBeenCalledWith(
                { _id: '1', userId: 'user-1' },
                { returnDocument: 'after' }
            );
            expect(Task.updateMany).toHaveBeenCalledWith(
                { tagIds: '1', userId: 'user-1' },
                { $pull: { tagIds: '1' } }
            );
        });

        it('throws when the tag is not found', async () => {
            Tag.findOneAndDelete.mockResolvedValue(null);

            await expect(deleteTag.call({ id: 'missing', userId: 'user-1' }))
                .rejects.toThrow('Tag not found');

            expect(Task.updateMany).not.toHaveBeenCalled();
        });
    });
});