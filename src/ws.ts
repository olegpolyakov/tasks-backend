import { ServerOptions, WebSocketServer } from 'ws';

import type { Server } from '@olegpolyakov/backend/server';

export type WebSocketServerPlugin = (wss: WebSocketServer) => WebSocketServer;

export default ({ path = '/ws' }: ServerOptions, plugins: WebSocketServerPlugin[] = []) => (server: Server) => {
    const wss = new WebSocketServer({
        server: server.server,
        path
    });

    wss.on('listening', () => {
        console.log(`WebSocket server is running on ${server.host}:${server.port}${wss.options.path}`);
    });

    plugins.forEach(plugin => plugin(wss));
};