import { vi } from 'vitest';

export type Model = ReturnType<typeof createModel>;
export type ProjectModel = ReturnType<typeof createModel>;
export type TagModel = ReturnType<typeof createModel>;
export type TaskModel = ReturnType<typeof createModel>;

export function createModel() {
    return {
        countDocuments: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
        findByIdAndUpdate: vi.fn(),
        findByIdAndDelete: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn(),
        updateMany: vi.fn()
    };
}