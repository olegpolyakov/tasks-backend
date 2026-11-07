import { Router } from 'express';
import { z } from 'zod';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { McpServer } from '@modelcontextprotocol/server';

import { getUserId } from '@olegpolyakov/backend/features/auth';

import type { Context } from '@/context';

import projects from './projects';
import tags from './tags';
import tasks from './tasks';

export default (context: Context) => {
    const router = Router();
    const tools = {
        ...projects(context),
        ...tags(context),
        ...tasks(context)
    };

    router.all('/', async (req, res) => {
        const userId = getUserId(req);
        const server = new McpServer({
            name: 'tasks',
            version: '0.1.0'
        });

        for (const tool of Object.values(tools)) {
            const inputSchema = z.fromJSONSchema(tool.inputSchema);

            server.registerTool(tool.name, {
                description: tool.description,
                inputSchema
            }, async (args: any) => {
                if (!args || typeof args !== 'object' || Array.isArray(args)) {
                    throw new Error('Tool arguments must be an object');
                }

                if (args.userId !== userId) {
                    throw new Error('Tool userId must match the authenticated user');
                }

                return await tool.call(args);
            });
        }

        const transport = new NodeStreamableHTTPServerTransport({
            sessionIdGenerator: undefined
        });

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    });

    return router;
};