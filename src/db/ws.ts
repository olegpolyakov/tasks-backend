import { WebSocketServer } from 'ws';

import type { Server } from '@olegpolyakov/backend/server';

import type Context from '@/context.ts';

export default ({ models: { Task } }: Context) => (server: Server) => {
    const wss = new WebSocketServer({ port: 8080 });

    console.log('WebSocket server running on port 8080');

    const pipeline = [{
        $match: { operationType: { $in: ['insert', 'update', 'delete'] } }
    }];
    const changeStream = Task.watch(pipeline, {
        fullDocument: 'updateLookup', // ensures the full document is returned on updates
        hydrate: true
    }); 

    changeStream.on('change', event => {
        const payload = JSON.stringify({
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
        console.error('Mongoose Change Stream Error:', error);
    });
};