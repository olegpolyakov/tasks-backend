import { beforeEach, describe, expect, it } from 'vitest';

import createTagsTools from '../../../src/ai/tools/tags.ts';
import type Context from '../../../src/context.ts';

import { createContext, createModel, TagModel, TaskModel } from './helpers.ts';

describe('tag tools', () => {
    let Tag: TagModel;
    let Task: TaskModel;
    let context: Context;

    beforeEach(() => {
        Tag = createModel();
        Task = createModel();
        context = createContext({ Tag, Task });
    });

    it('counts tags for the user', async () => {
        Tag.countDocuments.mockResolvedValue(2);

        const tools = createTagsTools(context);
        const result = await tools.countTags.call({ userId: 'user-1' });

        expect(Tag.countDocuments).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(result).toBe('2');
    });

    it('lists tag names for the user', async () => {
        Tag.find.mockResolvedValue([
            { name: 'Work' },
            { name: 'Home' }
        ]);

        const tools = createTagsTools(context);
        const result = await tools.listTags.call({ userId: 'user-1' });

        expect(Tag.find).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(result).toBe('Work, Home');
    });

    it('finds a tag by name query for the user', async () => {
        Tag.findOne.mockResolvedValue({
            toJSON: () => ({ id: 'tag-1', name: 'Work' })
        });

        const tools = createTagsTools(context);
        const result = await tools.findTag.call({ query: 'wor', userId: 'user-1' });

        expect(Tag.findOne).toHaveBeenCalledWith({
            name: { $regex: 'wor', $options: 'i' },
            userId: 'user-1'
        });
        expect(result).toBe(JSON.stringify({ id: 'tag-1', name: 'Work' }));
    });

    it('gets a tag by id for the user', async () => {
        Tag.findOne.mockResolvedValue({
            toJSON: () => ({ id: 'tag-1', name: 'Work' })
        });

        const tools = createTagsTools(context);
        const result = await tools.getTag.call({ id: 'tag-1', userId: 'user-1' });

        expect(Tag.findOne).toHaveBeenCalledWith({ _id: 'tag-1', userId: 'user-1' });
        expect(result).toBe(JSON.stringify({ id: 'tag-1', name: 'Work' }));
    });

    it('creates a tag scoped to the user', async () => {
        Tag.create.mockResolvedValue({
            toJSON: () => ({ id: 'tag-1', name: 'Work', userId: 'user-1' })
        });

        const tools = createTagsTools(context);
        const result = await tools.createTag.call({
            name: 'Work',
            userId: 'user-1'
        });

        expect(Tag.create).toHaveBeenCalledWith({ name: 'Work', userId: 'user-1' });
        expect(result).toBe('Created ' + JSON.stringify({ id: 'tag-1', name: 'Work', userId: 'user-1' }));
    });

    it('updates a tag for the user', async () => {
        Tag.findOneAndUpdate.mockResolvedValue({
            toJSON: () => ({ id: 'tag-1', name: 'Updated' })
        });

        const tools = createTagsTools(context);
        const result = await tools.updateTag.call({
            id: 'tag-1',
            userId: 'user-1',
            data: { name: 'Updated' }
        });

        expect(Tag.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'tag-1', userId: 'user-1' }, { name: 'Updated' });
        expect(result).toBe('Updated ' + JSON.stringify({ id: 'tag-1', name: 'Updated' }));
    });

    it('deletes a tag and optionally removes it from tasks', async () => {
        Tag.findOneAndDelete.mockResolvedValue({
            toJSON: () => ({ id: 'tag-1' })
        });

        const tools = createTagsTools(context);
        const result = await tools.deleteTag.call({
            id: 'tag-1',
            userId: 'user-1',
            deleteTasks: true
        });

        expect(Tag.findOneAndDelete).toHaveBeenCalledWith({ _id: 'tag-1', userId: 'user-1' });
        expect(Task.updateMany).toHaveBeenCalledWith({
            tagIds: 'tag-1',
            userId: 'user-1'
        }, {
            $pull: { tagIds: 'tag-1' }
        });
        expect(result).toBe('Deleted ' + JSON.stringify({ id: 'tag-1' }));
    });
});