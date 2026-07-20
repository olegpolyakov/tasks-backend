import { Readable } from 'stream';
import { describe, expect, it } from 'vitest';

import router from '../../src/ai/router.ts';
import type Context from '../../src/context.ts';
import { HOST, PORT, useRouter } from '../helpers/server.ts';

const { OLLAMA_TOKEN = '' } = process.env;
const context = {
    config: { OLLAMA_TOKEN }
} as Context;

describe('AI Router', () => {
    useRouter(router(context));

    describe('/chat', () => {
        it('response with a message', async () => {
            const res = await fetch(`http://${HOST}:${PORT}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Hi!' })
            });

            expect(res.status).toBe(200);
            expect(res.headers.get('content-type')).toContain('text/event-stream');
            expect(res.body).not.toBeNull();

            const chunks: string[] = [];

            for await (const chunk of Readable.fromWeb(res.body!)) {
                const text = chunk.toString();

                console.log(text);
                chunks.push(text);
            }

            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks.join('')).not.toHaveLength(0);
        }, 10000);
    });
});