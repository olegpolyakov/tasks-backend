import { Router } from 'express';
import { Message } from 'ollama';

import { AuthedRequest } from '@olegpolyakov/backend/features/auth';

import type Context from '../context.ts';

import Agent from './agent.ts';

export default (context: Context) => {
    const router = Router();
    const agent = Agent(context);

    router.post('/chat', async (req, res) => {
        const userId = (req as AuthedRequest).userId;
        const {
            messages,
            model = 'gemma4:31b-cloud',
            stream = false
        } = req.body as {
            messages: Message[];
            model: string;
            stream: boolean;
        };

        try {
            if (stream) {
                // TODO Enable streaming
                // res.setHeader('Content-Type', 'text/event-stream');
                // res.setHeader('Connection', 'keep-alive');
                // res.setHeader('Transfer-Encoding', 'chunked');
                // res.setHeader('Cache-Control', 'no-cache');

                // agent.run(userId, messages, { stream });
            
                // const stream = await ollama.chat({
                //     model,
                //     messages,
                //     stream: true,
                //     tools: tools.definitions
                // });
            
                // for await (const chunk of stream) {
                //     res.write(JSON.stringify(chunk.message) + '\n'); 
                // }
    
                // res.end();
            } else {
                res.setHeader('Content-Type', 'application/json');

                const response = await agent.chat(userId, messages, {
                    model
                });

                return res.send(response.message);
            }
        } catch (error) {
            console.error('AI stream error:', error);

            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to process request' });
            } else {
                res.end();
            }
        }
    });

    return router;
};