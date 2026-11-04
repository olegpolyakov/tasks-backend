import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ServerMiddleware } from '@olegpolyakov/backend/server';
import { useDb } from '@olegpolyakov/backend/test/mocks/db';
import { useModel } from '@olegpolyakov/backend/test/mocks/models';
import { useServer } from '@olegpolyakov/backend/test/mocks/server';
import { USER_ID, useUser } from '@olegpolyakov/backend/test/mocks/user';

import type { Context } from '@/context';
import router from '@/mcp';
import { ProjectSchema, TagSchema, TaskSchema } from '@/models';

const {
    HOST = 'localhost',
    PORT = 3000
} = process.env;

const authenticateTestRequest: ServerMiddleware = (req, res, next) => {
    const userId = req.header('x-user-id');

    if (userId) req.userId = userId;

    next();
};

describe('MCP Router', () => {
    const db = useDb();
    useUser(db);
    const Project = useModel(db, 'Project', ProjectSchema, { beforeEach: true });
    const Tag = useModel(db, 'Tag', TagSchema, { beforeEach: true });
    const Task = useModel(db, 'Task', TaskSchema, { beforeEach: true });
    const context = {
        config: {},
        models: { Project, Tag, Task }
    } as unknown as Context;
    const server = useServer(
        { host: HOST, port: PORT },
        authenticateTestRequest,
        router(context)
    );
    const agent = supertest.agent(server);
    let requestId = 0;

    beforeEach(() => {
        requestId = 0;
    });

    it('rejects unauthenticated requests', async () => {
        const response = await agent.post('/')
            .set('Accept', 'application/json, text/event-stream')
            .send({
                jsonrpc: '2.0',
                id: ++requestId,
                method: 'tools/list'
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'User ID is missing' });
    });

    it('returns a protocol error for an unknown method', async () => {
        const response = await call('unknown/method');

        expect(response.error).toMatchObject({
            code: -32601,
            message: expect.any(String)
        });
    });

    describe('tools/list', () => {
        it.only('lists project, tag, and task tools', async () => {
            const response = await call('tools/list');

            const tools = response.result?.tools ?? [];

            console.log(tools[5].inputSchema);

            expect(tools.map(tool => tool.name)).toEqual(expect.arrayContaining([
                'countProjects',
                'listProjects',
                'findProject',
                'getProject',
                'createProject',
                'updateProject',
                'deleteProject',
                'countTags',
                'listTags',
                'findTag',
                'getTag',
                'createTag',
                'updateTag',
                'deleteTag',
                'countTasks',
                'listTasks',
                'findTask',
                'getTask',
                'createTask',
                'updateTask',
                'deleteTask'
            ]));
        });

        it('lists userId as a required tool argument', async () => {
            const response = await call('tools/list');
            const createTaskTool = response.result?.tools?.find(tool => tool.name === 'createTask');

            expect(createTaskTool?.inputSchema.properties).toHaveProperty('userId');
            expect(createTaskTool?.inputSchema.required).toContain('userId');
        });
    });

    it('rejects a tool call for a user other than the authenticated user', async () => {
        const response = await callTool('countTasks', { userId: 'other-user' });

        expect(response.result?.isError).toBe(true);
        expect(asText(response)).toContain('Tool userId must match the authenticated user');
    });

    describe('project tools', () => {
        it('counts only the authenticated user’s projects', async () => {
            await Project.create({ name: 'Work', userId: USER_ID });
            await Project.create({ name: 'Personal', userId: USER_ID });
            await Project.create({ name: 'Other user project', userId: 'other-user' });

            expect(asText(await callTool('countProjects'))).toBe('2');
        });

        it('lists only the authenticated user’s projects', async () => {
            await Project.create({ name: 'Work', userId: USER_ID });
            await Project.create({ name: 'Personal', userId: USER_ID });
            await Project.create({ name: 'Other user project', userId: 'other-user' });

            expect(asText(await callTool('listProjects'))).toBe('Work, Personal');
        });

        it('finds a project by name for the authenticated user', async () => {
            const work = await Project.create({ name: 'Work', userId: USER_ID });
            await Project.create({ name: 'Work', userId: 'other-user' });

            expect(JSON.parse(asText(await callTool('findProject', { query: 'work' }))))
                .toMatchObject({ id: work.id, name: 'Work' });
        });

        it('gets a project by id for the authenticated user', async () => {
            const work = await Project.create({ name: 'Work', userId: USER_ID });

            expect(JSON.parse(asText(await callTool('getProject', { id: work.id }))))
                .toMatchObject({ id: work.id, name: 'Work' });
        });

        it('creates a project for the authenticated user', async () => {
            const created = await callTool('createProject', { name: 'Work' });

            expect(created.result?.isError).not.toBe(true);

            const project = await Project.findOne({ name: 'Work', userId: USER_ID });

            expect(project).not.toBeNull();
            expect(asText(created)).toContain('Created ');
        });

        it('updates a project for the authenticated user', async () => {
            const project = await Project.create({ name: 'Work', userId: USER_ID });
            const updated = await callTool('updateProject', {
                id: project.id,
                data: { name: 'Updated work' }
            });

            expect(asText(updated)).toContain('Updated ');
            await expect(Project.findOne({ _id: project.id, userId: USER_ID })).resolves.toMatchObject({
                name: 'Updated work'
            });
        });

        it('deletes a project and its root and section tasks when requested', async () => {
            const rootTask = await Task.create({ title: 'Root task', userId: USER_ID });
            const sectionTask = await Task.create({ title: 'Section task', userId: USER_ID });
            const otherUserTask = await Task.create({ title: 'Other user task', userId: 'other-user' });
            const project = await Project.create({
                name: 'Work',
                taskIds: [rootTask.id],
                sectionData: { section1: { taskIds: [sectionTask.id] } },
                userId: USER_ID
            });

            const result = await callTool('deleteProject', {
                id: project.id,
                deleteTasks: 'true'
            });

            expect(asText(result)).toContain('Deleted ');
            await expect(Project.findOne({ _id: project.id, userId: USER_ID })).resolves.toBeNull();
            await expect(Task.findOne({ _id: rootTask.id })).resolves.toBeNull();
            await expect(Task.findOne({ _id: sectionTask.id })).resolves.toBeNull();
            await expect(Task.findOne({ _id: otherUserTask.id })).resolves.not.toBeNull();
        });
    });

    describe('task tools', () => {
        it('counts only the authenticated user’s tasks', async () => {
            await Task.create({ title: 'Buy milk', userId: USER_ID });
            await Task.create({ title: 'Walk dog', userId: USER_ID });
            await Task.create({ title: 'Other user task', userId: 'other-user' });

            expect(asText(await callTool('countTasks'))).toBe('2');
        });

        it('lists only the authenticated user’s tasks', async () => {
            await Task.create({ title: 'Buy milk', userId: USER_ID });
            await Task.create({ title: 'Walk dog', userId: USER_ID });
            await Task.create({ title: 'Other user task', userId: 'other-user' });

            expect(asText(await callTool('listTasks'))).toBe('Buy milk, Walk dog');
        });

        it('finds a task by title for the authenticated user', async () => {
            const task = await Task.create({ title: 'Buy milk', userId: USER_ID });
            await Task.create({ title: 'Buy milk', userId: 'other-user' });

            expect(JSON.parse(asText(await callTool('findTask', { query: 'milk' }))))
                .toMatchObject({ id: task.id, title: 'Buy milk' });
        });

        it('gets a task by id for the authenticated user', async () => {
            const task = await Task.create({ title: 'Buy milk', userId: USER_ID });

            expect(JSON.parse(asText(await callTool('getTask', { id: task.id }))))
                .toMatchObject({ id: task.id, title: 'Buy milk' });
        });

        it('creates a task for the requested user', async () => {
            const created = await callTool('createTask', {
                title: 'Buy milk',
                userId: USER_ID
            });

            expect(asText(created)).toContain('Created ');
            await expect(Task.findOne({ title: 'Buy milk', userId: USER_ID })).resolves.not.toBeNull();
        });

        it('updates a task for the requested user', async () => {
            const task = await Task.create({ title: 'Buy milk', userId: USER_ID });

            const updated = await callTool('updateTask', {
                id: task.id,
                data: { title: 'Buy oat milk' }
            });

            expect(asText(updated)).toContain('Updated ');
            await expect(Task.findOne({ _id: task.id, userId: USER_ID })).resolves.toMatchObject({
                title: 'Buy oat milk'
            });
        });

        it('deletes a task for the requested user', async () => {
            const task = await Task.create({ title: 'Buy milk', userId: USER_ID });

            const deleted = await callTool('deleteTask', { id: task.id });

            expect(asText(deleted)).toContain('Deleted ');
            await expect(Task.findOne({ _id: task.id, userId: USER_ID })).resolves.toBeNull();
        });
    });

    describe('tag tools', () => {
        it('counts only the authenticated user’s tags', async () => {
            await Tag.create({ name: 'urgent', userId: USER_ID });
            await Tag.create({ name: 'home', userId: USER_ID });
            await Tag.create({ name: 'Other user tag', userId: 'other-user' });

            expect(asText(await callTool('countTags'))).toBe('2');
        });

        it('lists only the authenticated user’s tags', async () => {
            await Tag.create({ name: 'urgent', userId: USER_ID });
            await Tag.create({ name: 'home', userId: USER_ID });
            await Tag.create({ name: 'Other user tag', userId: 'other-user' });

            expect(asText(await callTool('listTags'))).toBe('urgent, home');
        });

        it('finds a tag by name for the authenticated user', async () => {
            const tag = await Tag.create({ name: 'urgent', userId: USER_ID });
            await Tag.create({ name: 'urgent', userId: 'other-user' });

            expect(JSON.parse(asText(await callTool('findTag', { query: 'urgent' }))))
                .toMatchObject({ id: tag.id, name: 'urgent' });
        });

        it('gets a tag by id for the authenticated user', async () => {
            const tag = await Tag.create({ name: 'urgent', userId: USER_ID });

            expect(JSON.parse(asText(await callTool('getTag', { id: tag.id }))))
                .toMatchObject({ id: tag.id, name: 'urgent' });
        });

        it('creates a tag for the authenticated user', async () => {
            const created = await callTool('createTag', { name: 'urgent' });

            expect(asText(created)).toContain('Created ');
            await expect(Tag.findOne({ name: 'urgent', userId: USER_ID })).resolves.not.toBeNull();
        });

        it('updates a tag for the authenticated user', async () => {
            const tag = await Tag.create({ name: 'urgent', userId: USER_ID });

            const updated = await callTool('updateTag', {
                id: tag.id,
                data: { name: 'important' }
            });

            expect(asText(updated)).toContain('Updated ');
            await expect(Tag.findOne({ _id: tag.id, userId: USER_ID })).resolves.toMatchObject({
                name: 'important'
            });
        });

        it('deletes a tag and removes it from the authenticated user’s tasks', async () => {
            const tag = await Tag.create({ name: 'urgent', userId: USER_ID });
            const task = await Task.create({
                title: 'Tagged task',
                tagIds: [tag.id],
                userId: USER_ID
            });
            const otherUserTask = await Task.create({
                title: 'Other user tagged task',
                tagIds: [tag.id],
                userId: 'other-user'
            });
            const deleted = await callTool('deleteTag', { id: tag.id });

            expect(asText(deleted)).toContain('Deleted ');
            await expect(Tag.findOne({ _id: tag.id, userId: USER_ID })).resolves.toBeNull();
            await expect(Task.findOne({ _id: task.id })).resolves.toMatchObject({ tagIds: [] });
            await expect(Task.findOne({ _id: otherUserTask.id })).resolves.toMatchObject({
                tagIds: [tag.id]
            });
        });
    });

    async function call(method: string, params?: Record<string, unknown>): Promise<McpResponse> {
        const response = await agent.post('/')
            .set('Accept', 'application/json, text/event-stream')
            .set('x-user-id', USER_ID)
            .send({
                jsonrpc: '2.0',
                id: ++requestId,
                method,
                ...(params ? { params } : {})
            });

        expect(response.status).toBe(200);

        const data = response.text.split(/\r?\n/).find(line => line.startsWith('data: '));

        if (!data) throw new Error('MCP response did not contain an event payload');

        return JSON.parse(data.slice('data: '.length)) as McpResponse;
    }

    async function callTool(name: string, args: Record<string, unknown> = {}) {
        return call('tools/call', {
            name,
            arguments: { userId: USER_ID, ...args }
        });
    }

    function asText(response: McpResponse): string {
        const text = response.result?.content?.find(content => content.type === 'text')?.text;

        if (text === undefined) {
            throw new Error('MCP tool response did not contain text content');
        }

        return text;
    }
});

type McpResponse = {
    error?: {
        code: number;
        message: string;
    };
    result?: {
        content?: { type: string; text?: string }[];
        isError?: boolean;
        tools?: {
            name: string;
            inputSchema: {
                properties?: Record<string, unknown>;
                required?: string[];
            };
        }[];
    };
};