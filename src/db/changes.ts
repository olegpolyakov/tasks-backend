import { WebSocketServer } from 'ws';

import type Context from '@/context.ts';

export default ({ models: { Task, Tag, Project } }: Context) => (wss: WebSocketServer): WebSocketServer => {
    const models = [Task, Tag, Project];
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

    return wss;
};