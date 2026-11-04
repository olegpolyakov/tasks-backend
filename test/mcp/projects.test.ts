import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockModel } from '@olegpolyakov/backend/test/mocks/models';

import type { Context } from '@/context';
import createProjectTools from '@/mcp/projects';

describe('Projects tools', () => {
    const Project = mockModel();
    const Task = mockModel();
    
    const context = {
        config: {},
        models: {
            Project,
            Task
        }
    } as unknown as Context;
    const {
        countProjects,
        listProjects,
        findProject,
        getProject,
        createProject,
        updateProject,
        deleteProject
    } = createProjectTools(context);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('countProjects tool', () => {
        it('counts projects scoped to the user', async () => {
            Project.countDocuments.mockResolvedValue(2);

            const result = await countProjects.call({ userId: 'user-1' });

            expect(result).toBe('2');
            expect(Project.countDocuments).toHaveBeenCalledWith({ userId: 'user-1' });
        });
    });

    describe('listProjects tool', () => {
        it('lists project names scoped to the user', async () => {
            Project.find.mockResolvedValue([
                { name: 'Work' },
                { name: 'Personal' }
            ]);

            const result = await listProjects.call({ userId: 'user-1' });

            expect(result).toBe('Work, Personal');
            expect(Project.find).toHaveBeenCalledWith({ userId: 'user-1' });
        });
    });

    describe('findProject tool', () => {
        it('finds a project by a case-insensitive name query for the user', async () => {
            const project = {
                toJSON: () => ({ id: '1', name: 'Work' })
            };
            Project.findOne.mockResolvedValue(project);

            const result = await findProject.call({ query: 'work', userId: 'user-1' });

            expect(result).toBe(JSON.stringify({ id: '1', name: 'Work' }));
            expect(Project.findOne).toHaveBeenCalledWith({
                name: { $regex: 'work', $options: 'i' },
                userId: 'user-1'
            });
        });

        it('throws when the project is not found', async () => {
            Project.findOne.mockResolvedValue(null);

            await expect(findProject.call({ query: 'missing', userId: 'user-1' }))
                .rejects.toThrow('Project not found');
        });
    });

    describe('getProject tool', () => {
        it('gets a project by id scoped to the user', async () => {
            Project.findOne.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'Work' })
            });

            const result = await getProject.call({ id: '1', userId: 'user-1' });

            expect(result).toBe(JSON.stringify({ id: '1', name: 'Work' }));
            expect(Project.findOne).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
        });

        it('throws when the project is not found', async () => {
            Project.findOne.mockResolvedValue(null);

            await expect(getProject.call({ id: 'missing', userId: 'user-1' }))
                .rejects.toThrow('Project not found');
        });
    });

    describe('createProject tool', () => {
        it('creates a project scoped to the user', async () => {
            Project.create.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'Work', userId: 'user-1' })
            });

            const result = await createProject.call({ name: 'Work', userId: 'user-1' });

            expect(result).toBe('Created ' + JSON.stringify({ id: '1', name: 'Work', userId: 'user-1' }));
            expect(Project.create).toHaveBeenCalledWith({ name: 'Work', userId: 'user-1' });
        });
    });

    describe('updateProject tool', () => {
        it('updates an existing project', async () => {
            Project.findOneAndUpdate.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'Updated' })
            });

            const result = await updateProject.call({
                id: '1',
                userId: 'user-1',
                data: { name: 'Updated' }
            });

            expect(result).toBe('Updated ' + JSON.stringify({ id: '1', name: 'Updated' }));
            expect(Project.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '1', userId: 'user-1' },
                { name: 'Updated' },
                { returnDocument: 'after' }
            );
        });

        it('throws when the project to update is not found', async () => {
            Project.findOneAndUpdate.mockResolvedValue(null);

            await expect(updateProject.call({
                id: 'missing',
                userId: 'user-1',
                data: {}
            })).rejects.toThrow('Project not found');
        });
    });

    describe('deleteProject tool', () => {
        it('deletes a project scoped to the user', async () => {
            Project.findOneAndDelete.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'Work' }),
                taskIds: [],
                sectionData: {}
            });

            const result = await deleteProject.call({ id: '1', userId: 'user-1' });

            expect(result).toBe('Deleted ' + JSON.stringify({ id: '1', name: 'Work' }));
            expect(Project.findOneAndDelete).toHaveBeenCalledWith(
                { _id: '1', userId: 'user-1' },
                { returnDocument: 'after' }
            );
            expect(Task.deleteMany).not.toHaveBeenCalled();
        });

        it('deletes the project tasks when requested', async () => {
            Project.findOneAndDelete.mockResolvedValue({
                toJSON: () => ({ id: '1', name: 'Work' }),
                taskIds: ['task-1'],
                sectionData: {
                    section1: { taskIds: ['task-2'] },
                    section2: { taskIds: ['task-3'] }
                }
            });

            await deleteProject.call({ id: '1', userId: 'user-1', deleteTasks: 'true' });

            expect(Task.deleteMany).toHaveBeenCalledWith({
                _id: { $in: ['task-1', 'task-2', 'task-3'] },
                userId: 'user-1'
            });
        });

        it('throws when the project is not found', async () => {
            Project.findOneAndDelete.mockResolvedValue(null);

            await expect(deleteProject.call({ id: 'missing', userId: 'user-1' }))
                .rejects.toThrow('Project not found');

            expect(Task.deleteMany).not.toHaveBeenCalled();
        });
    });
});