import { Router } from 'express';

import { getUserId } from '@olegpolyakov/backend/features/auth';

import type Context from '@/context.ts';

import projects from './slices/projects.ts';
import tags from './slices/tags.ts';
import tasks from './slices/tasks.ts';
import Mcp from './lib.ts';

export default (context: Context) => {
    const router = Router();
    const slices = {
        projects: projects(context),
        tags: tags(context),
        tasks: tasks(context)
    };
    
    router.post('/', async (req, res) => {
        const { id, method, params } = req.body;
        
        try {
            const userId = getUserId(req);
            const mcp = Mcp(slices, userId);

            let result;

            if (method === 'resources/list') {
                result = await mcp.listResources();
            } else if (method === 'resources/read') {
                result = await mcp.readResource(params.uri);
            } else if (method === 'tools/list') {
                result = mcp.getTools();
            } else if (method === 'tools/call') {
                result = await mcp.callTool(params);
            } else if (method === 'prompts/list') {
                result = mcp.listPrompts();
            } else if (method === 'prompts/get') {
                result = mcp.getPrompt(params);
            } else {
                throw new Error('Unknown method');
            }

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