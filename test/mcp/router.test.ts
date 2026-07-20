import { beforeEach, describe, expect, it, vi } from 'vitest';

import type Context from '../../src/context.ts';
import router from '../../src/mcp/router.ts';
import { createTaskModel, type TaskModel } from '../helpers/models.ts';
import { createClient, createServer } from '../helpers/server.ts';

const Task = createTaskModel();
const context = { models: { Task } } as unknown as Context;
const client = createClient(createServer(s => s.use(router(context))));

describe('MCP Router', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns an error when the request is unauthenticated', async () => {
        // The auth check happens outside the router's try/catch, so it is
        // handled by the server's generic error middleware instead of being
        // wrapped in the JSON-RPC error shape.
        const result = await call({ id: 1, method: 'tools/list' });

        expect(result).toEqual({ error: 'Unauthenticated request' });
    });

    it('returns an error for an unknown method', async () => {
        const result = await call({ id: 2, method: 'unknown/method' }, { 'x-user-id': 'user-1' });

        expect(result).toEqual({
            jsonrpc: '2.0',
            id: 2,
            error: { code: -32000, message: 'Unknown method' }
        });
    });

    it('lists tools', async () => {
        const result = await call({ id: 3, method: 'tools/list' }, { 'x-user-id': 'user-1' });

        expect(result.jsonrpc).toBe('2.0');
        expect(result.id).toBe(3);
        expect(result.result.tools).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'createTask' }),
                expect.objectContaining({ name: 'updateTask' }),
                expect.objectContaining({ name: 'toggleTask' }),
                expect.objectContaining({ name: 'deleteTask' })
            ])
        );
    });

    it('lists resources', async () => {
        Task.find.mockResolvedValue([{ id: '1', title: 'Buy milk' }]);

        const result = await call({ id: 4, method: 'resources/list' }, { 'x-user-id': 'user-1' });

        expect(result).toEqual({
            jsonrpc: '2.0',
            id: 4,
            result: { resources: [{ uri: 'tasks://1', name: 'Buy milk', mimeType: 'application/json' }] }
        });
    });

    it('reads a resource', async () => {
        const populate = vi.fn().mockResolvedValue({ toJSON: () => ({ id: '1', title: 'Buy milk' }) });

        Task.findOne.mockReturnValue({ populate });

        const result = await call({
            id: 5,
            method: 'resources/read',
            params: { uri: 'tasks://1' }
        }, { 'x-user-id': 'user-1' });

        expect(Task.findOne).toHaveBeenCalledWith({ _id: '1', userId: 'user-1' });
        expect(result).toEqual({
            jsonrpc: '2.0',
            id: 5,
            result: { contents: { id: '1', title: 'Buy milk' } }
        });
    });

    it('calls a tool', async () => {
        Task.create.mockResolvedValue({ id: '1', title: 'New task' });

        const result = await call({
            id: 6,
            method: 'tools/call',
            params: { name: 'createTask', arguments: { data: { title: 'New task' } } }
        }, { 'x-user-id': 'user-1' });

        expect(Task.create).toHaveBeenCalledWith({ title: 'New task', userId: 'user-1' });
        expect(result).toEqual({
            jsonrpc: '2.0',
            id: 6,
            result: { id: '1', title: 'New task' }
        });
    });

    it('lists prompts', async () => {
        const result = await call({ id: 7, method: 'prompts/list' }, { 'x-user-id': 'user-1' });

        expect(result).toEqual({
            jsonrpc: '2.0',
            id: 7,
            result: {
                prompts: [{
                    name: 'taskDescription',
                    description: 'Generate a task description template',
                    arguments: [{ name: 'topic', type: 'string' }]
                }]
            }
        });
    });

    it('gets a prompt', async () => {
        const result = await call({
            id: 8,
            method: 'prompts/get',
            params: { name: 'taskDescription', arguments: { topic: 'groceries' } }
        }, { 'x-user-id': 'user-1' });

        expect(result).toEqual({
            jsonrpc: '2.0',
            id: 8,
            result: { messages: [{ role: 'user', content: 'Create a todo related to groceries' }] }
        });
    });
});

async function call(body: unknown, headers: Record<string, string> = {}) {
    const res = await client.post('/').set(headers).send(body);

    return res.body;
}