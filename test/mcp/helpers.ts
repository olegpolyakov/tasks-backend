import type { Tool } from '../../src/mcp/lib.ts';

export function getTool(tools: Tool[], name: string): Tool {
    const tool = tools.find(t => t.name === name);

    if (!tool) throw new Error(`Tool "${name}" not found`);

    return tool;
}