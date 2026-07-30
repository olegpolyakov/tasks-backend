import { WebSocketServer } from 'ws';

import type { Server } from '@olegpolyakov/backend/server';

import type Context from '@/context.ts';

export default ({ models: { Task, Project } }: Context) => (server: Server) => {
    const wss = new WebSocketServer({
        server: server.server,
        path: '/ws'
    });

    wss.on('listening', () => {
        console.log(`WebSocket server is running on ${server.host}:${server.port}${wss.options.path}`);
    });

    const models = [Task, Project];
    const pipeline = [{
        $match: { operationType: { $in: ['insert', 'update', 'delete'] } }
    }];
    const options = {
        fullDocument: 'updateLookup', // ensures the full document is returned on updates
        hydrate: true
    };

    models.forEach(model => {
        const changeStream = model.watch(pipeline, options); 

        changeStream.on('change', event => {
            const payload = JSON.stringify({
                model: model.modelName,
                action: event.operationType,
                documentId: event.documentKey._id,
                data: event.fullDocument
            });

            wss.clients.forEach(client => {
                if (client.readyState === 1) { // OPEN
                    client.send(payload);
                }
            });
        });

        changeStream.on('error', error => {
            console.error('Change Stream Error:', error);
        });
    });  
};