import express, { Application, type ErrorRequestHandler, type Router } from 'express';
import type { Server } from 'http';
import supertest from 'supertest';
import { afterAll, beforeAll, vi } from 'vitest';

import type { Next, Request, Response, ServerError } from '@olegpolyakov/backend/server';

export const {
    HOST = 'localhost',
    PORT = 3000
} = process.env;

export function createServer(setup?: (app: Application) => void): Application {
    const app = express();
    
    app.use(express.json());
    app.use((req: Request, res, next) => {
        const userId = req.header('x-user-id');
    
        if (userId) req.userId = userId;
    
        next();
    });
    
    setup?.(app);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use(((error, req, res, next) => {
        res.status(500).json({ error: error.message });
    }) as ErrorRequestHandler);

    return app;
}

export function createClient(server: Application) {
    return supertest.agent(server);
}

export function useServer(
    setup?: (app: Application) => void
): Application {
    const app = express();
    let server: Server;

    beforeAll(() => {
        app.use(express.json());

        setup?.(app);

        app.use((error: ServerError, req: Request, res: Response, next: Next) => {
            console.error(error);
            res.status(error.statusCode || 500).json({ error: error.message });
        });

        server = app.listen(Number(PORT), HOST, () => {
            console.log(`Server started at http://${HOST}:${PORT}`);
        });
    });

    afterAll(() => {
        server.close(() => {
            console.log('Server stopped');
        });
    });

    return app;
}

export function useRouter(router: Router): Application {
    return useServer(app => app.use(router));
}

export function mockRequest<T>({ body, headers = {} }: {body?: T, headers?: Record<string, string>} = {}): Request {
    return {
        body,
        headers
    } as unknown as Request;
}

export function mockResponse(): Response {
    return {
        json: vi.fn(),
        redirect: vi.fn(),
        status: vi.fn().mockReturnThis(),
        end: vi.fn()
    } as unknown as Response;
}

export function mockNext(): Next {
    return vi.fn();
}