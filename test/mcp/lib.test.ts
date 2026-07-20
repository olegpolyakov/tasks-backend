import { describe, expect, it, vi } from 'vitest';

import Mcp, {
    createTool,
    type Prompt,
    type Resource,
    type Slice,
    type Tool
} from '../../src/mcp/lib.ts';

describe('Mcp', () => {
    describe('listResources', () => {
        it('aggregates resources from every slice', async () => {
            const foo: Resource = { uri: 'foo://1', name: 'Foo', mimeType: 'application/json' };
            const bar: Resource = { uri: 'bar://1', name: 'Bar', mimeType: 'application/json' };
            const slices = {
                foo: vi.fn(() => createSlice({ list: vi.fn().mockResolvedValue([foo]) })),
                bar: vi.fn(() => createSlice({ list: vi.fn().mockResolvedValue([bar]) }))
            };

            const mcp = Mcp(slices, 'user-1');
            const result = await mcp.listResources();

            expect(result).toEqual({ resources: [foo, bar] });
            expect(slices.foo).toHaveBeenCalledWith('user-1');
            expect(slices.bar).toHaveBeenCalledWith('user-1');
        });
    });

    describe('readResource', () => {
        it('reads a resource from the matching slice', async () => {
            const read = vi.fn().mockResolvedValue({ id: '1' });
            const slices = { foo: vi.fn(() => createSlice({ read })) };

            const mcp = Mcp(slices, 'user-1');
            const result = await mcp.readResource('foo://1');

            expect(read).toHaveBeenCalledWith('1');
            expect(result).toEqual({ contents: { id: '1' } });
        });

        it('throws for an unknown resource type', async () => {
            const mcp = Mcp({}, 'user-1');

            await expect(mcp.readResource('unknown://1')).rejects.toThrow('Unknown resource');
        });
    });

    describe('getTools', () => {
        it('lists tool metadata without execute', () => {
            const tool: Tool = { name: 't1', description: 'd1', execute: vi.fn() };
            const slices = { foo: vi.fn(() => createSlice({ tools: [tool] })) };

            const mcp = Mcp(slices, 'user-1');

            expect(mcp.getTools()).toEqual({ tools: [{ name: 't1', description: 'd1' }] });
        });
    });

    describe('callTool', () => {
        it('invokes the matching tool', async () => {
            const execute = vi.fn().mockResolvedValue('result');
            const tool: Tool = { name: 't1', description: 'd1', execute };
            const slices = { foo: vi.fn(() => createSlice({ tools: [tool] })) };

            const mcp = Mcp(slices, 'user-1');
            const result = await mcp.callTool({ name: 't1', arguments: { a: 1 } });

            expect(execute).toHaveBeenCalledWith({ a: 1 });
            expect(result).toBe('result');
        });

        it('throws for an unknown tool', async () => {
            const mcp = Mcp({}, 'user-1');

            await expect(mcp.callTool({ name: 'unknown', arguments: {} })).rejects.toThrow('Unknown tool');
        });
    });

    describe('listPrompts', () => {
        it('lists prompt metadata without get', () => {
            const prompt: Prompt = {
                name: 'p1',
                description: 'd1',
                arguments: [{ name: 'topic', type: 'string' }],
                get: vi.fn()
            };
            const slices = { foo: vi.fn(() => createSlice({ prompts: [prompt] })) };

            const mcp = Mcp(slices, 'user-1');

            expect(mcp.listPrompts()).toEqual({
                prompts: [{ name: 'p1', description: 'd1', arguments: [{ name: 'topic', type: 'string' }] }]
            });
        });
    });

    describe('getPrompt', () => {
        it('resolves the matching prompt', () => {
            const get = vi.fn().mockReturnValue({ messages: [{ role: 'user', content: 'hi' }] });
            const prompt: Prompt = { name: 'p1', description: 'd1', arguments: [], get };
            const slices = { foo: vi.fn(() => createSlice({ prompts: [prompt] })) };

            const mcp = Mcp(slices, 'user-1');
            const result = mcp.getPrompt({ name: 'p1', arguments: { topic: 'groceries' } });

            expect(get).toHaveBeenCalledWith({ topic: 'groceries' });
            expect(result).toEqual({ messages: [{ role: 'user', content: 'hi' }] });
        });

        it('throws for an unknown prompt', () => {
            const mcp = Mcp({}, 'user-1');

            expect(() => mcp.getPrompt({ name: 'unknown', arguments: {} })).toThrow('Unknown prompt');
        });
    });
});

describe('createTool', () => {
    it('wraps execute while preserving name and description', async () => {
        const execute = vi.fn().mockResolvedValue('ok');
        const tool = createTool('name', 'description', execute);

        expect(tool.name).toBe('name');
        expect(tool.description).toBe('description');
        await expect(tool.execute({ a: 1 })).resolves.toBe('ok');
        expect(execute).toHaveBeenCalledWith({ a: 1 });
    });
});

function createSlice(overrides: Partial<Slice> = {}): Slice {
    return {
        list: vi.fn().mockResolvedValue([]),
        read: vi.fn(),
        tools: [],
        prompts: [],
        ...overrides
    };
}