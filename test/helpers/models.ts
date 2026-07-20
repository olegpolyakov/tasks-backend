import { vi } from 'vitest';

export function createTaskModel() {
    return {
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        findByIdAndUpdate: vi.fn(),
        findByIdAndDelete: vi.fn()
    };
}

export type TaskModel = ReturnType<typeof createTaskModel>;