import type Context from '../../src/context.ts';

import type { Model } from './models.ts';


export function createContext(models: Record<string, Model>) {
    return {
        models
    } as unknown as Context;
}