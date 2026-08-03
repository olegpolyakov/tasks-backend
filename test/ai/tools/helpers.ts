import { vi } from 'vitest';

import type Context from '../../../src/context.ts';

export type Model = ReturnType<typeof createModel>;
export type ProjectModel = ReturnType<typeof createModel>;
export type TaskModel = ReturnType<typeof createModel>;
export type TagModel = ReturnType<typeof createModel>;

export function createContext(models: Record<string, Model>) {
    return {
        models
    } as unknown as Context;
}

export function createModel() {
    return {
        countDocuments: vi.fn(),
        deleteMany: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn(),
        updateMany: vi.fn()
    };
}