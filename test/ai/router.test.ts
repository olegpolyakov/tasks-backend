import { Readable } from 'stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import router from '../../src/ai/router.ts';
import type Context from '../../src/context.ts';
import { HOST, PORT, useRouter } from '../helpers/server.ts';

import { createContext, createModel } from './tools/helpers.ts';

const chat = vi.fn();

vi.mock('../../src/ai/agent.ts', () => ({
    default: vi.fn(() => ({
        chat
    }))
}));

const { OLLAMA_TOKEN = '' } = process.env;
const context = {
    ...createContext({
        Project: createModel(),
        Tag: createModel(),
        Task: createModel()
    }),
    config: { OLLAMA_TOKEN }
} as Context;

describe('AI Router', () => {
    useRouter(router(context));

    beforeEach(() => {
        chat.mockReset();
        chat.mockResolvedValue({
            message: {
                role: 'assistant',
                content: 'Hi!'
            }
        });
    });

    describe('/chat', () => {
        it('response with a message', async () => {
            const res = await fetch(`http://${HOST}:${PORT}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Hi!' }]
                })
            });

            expect(res.status).toBe(200);
            expect(res.headers.get('content-type')).toContain('application/json');
            expect(res.body).not.toBeNull();

            const chunks: string[] = [];

            for await (const chunk of Readable.fromWeb(res.body!)) {
                const text = chunk.toString();

                console.log(text);
                chunks.push(text);
            }

            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks.join('')).toContain('Hi!');
            expect(chat).toHaveBeenCalledWith(undefined, [{ role: 'user', content: 'Hi!' }], {
                model: 'gemma4:31b-cloud'
            });
        }, 10000);
    });
});