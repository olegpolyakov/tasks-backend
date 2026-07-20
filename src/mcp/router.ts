import { Router } from 'express';

import { Request } from '@olegpolyakov/backend/server';

import type Context from '@/context.ts';

import Mcp from './lib.ts';
import tasks from './tasks.ts';

export default (context: Context) => {
    const router = Router();
    const slices = {
        tasks: tasks(context)
    };
    
    router.post('/', async (req: Request, res) => {
        const { id, method, params } = req.body;
        const userId = req.userId;

        if (!userId) throw new Error('Unauthenticated request');
        
        try {
            const mcp = Mcp(slices, userId);
        
            let result;

            if (method === 'resources/list') {
                result = await mcp.listResources();
            }

            else if (method === 'resources/read') {
                result = await mcp.readResource(params.uri);
            }

            else if (method === 'tools/list') {
                result = mcp.getTools();
            }

            else if (method === 'tools/call') {
                result = await mcp.callTool(params);
            }

            else if (method === 'prompts/list') {
                result = mcp.listPrompts();
            }

            else if (method === 'prompts/get') {
                result = mcp.getPrompt(params);
            }

            else
                throw new Error('Unknown method');

            res.json({
                jsonrpc: '2.0',
                id,
                result
            });
        } catch(error) {
            res.json({
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32000,
                    message: (error as Error).message
                }
            });
        }
    });

    return router;
};