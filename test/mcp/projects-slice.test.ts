import { beforeEach, describe, expect, it, vi } from 'vitest';

import type Context from '../../src/context.ts';
import type { Slice } from '../../src/mcp/lib.ts';
import createProjectsSlice from '../../src/mcp/slices/projects.ts';
import { createModel } from '../helpers/models.ts';

import { getTool } from './helpers.ts';

describe('Projects slice', () => {
    const Project = createModel();
    const context = { models: { Project } } as unknown as Context;
    let slice: Slice;

    beforeEach(() => {
        slice = createProjectsSlice(context)('user-1');
        vi.resetAllMocks();
    });

    describe('list', () => {
        it('lists the user projects as resources', async () => {
            Project.find.mockResolvedValue([
                { id: '1', name: 'Work' },
                { id: '2', name: 'Personal' }
            ]);

            const resources = await slice.list();

            expect(Project.find).toHaveBeenCalledWith({ userId: 'user-1' });
            expect(resources).toEqual([
                { uri: 'projects://1', name: 'Work', mimeType: 'application/json' },
                { uri: 'projects://2', name: 'Personal', mimeType: 'application/json' }
            ]);
        });
    });

    describe('read', () => {
        it('reads a project by id for the user', async () => {
            Project.findOne.mockResolvedValue({ toJSON: () => ({ id: '1', name: 'Work' }) });

            const result = await slice.read('1');

            expect(Project.findOne).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
            expect(result).toEqual({ id: '1', name: 'Work' });
        });

        it('throws when the project is not found', async () => {
            Project.findOne.mockResolvedValue(null);

            await expect(slice.read('missing')).rejects.toThrow('Not found');
        });
    });

    describe('createProject tool', () => {
        it('creates a project scoped to the user', async () => {
            Project.create.mockResolvedValue({ id: '1', name: 'Work' });

            const tool = getTool(slice.tools, 'createProject');
            const result = await tool.execute({ data: { name: 'Work' } });

            expect(Project.create).toHaveBeenCalledWith({ name: 'Work', userId: 'user-1' });
            expect(result).toEqual({ id: '1', name: 'Work' });
        });
    });

    describe('updateProject tool', () => {
        it('updates an existing project', async () => {
            Project.findOneAndUpdate.mockResolvedValue({ toObject: () => ({ id: '1', name: 'Updated' }) });

            const tool = getTool(slice.tools, 'updateProject');
            const result = await tool.execute({ id: '1', data: { name: 'Updated' } });

            expect(Project.findOneAndUpdate).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' }, { name: 'Updated' }, { new: true });
            expect(result).toEqual({ id: '1', name: 'Updated' });
        });

        it('throws when the project to update is not found', async () => {
            Project.findOneAndUpdate.mockResolvedValue(null);

            const tool = getTool(slice.tools, 'updateProject');

            await expect(tool.execute({ id: 'missing', data: {} })).rejects.toThrow('Project not found');
        });
    });

    describe('deleteProject tool', () => {
        it('deletes a project by id', async () => {
            Project.findOneAndDelete.mockResolvedValue({ id: '1' });

            const tool = getTool(slice.tools, 'deleteProject');

            await tool.execute({ id: '1' });

            expect(Project.findOneAndDelete).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
        });
    });
});
