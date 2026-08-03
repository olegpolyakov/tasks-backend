export type Object = Record<string, unknown>;

export type Slice = {
    list: () => Promise<Resource[]>;
    read: (id: string) => Promise<unknown>;
    tools: Tool[];
    prompts: Prompt[];
};

export type Resource = {
    uri: string;
    name: string;
    mimeType: string;
};

export type Tool = {
    name: string;
    description: string;
    execute: (args: Object) => Promise<unknown>;
};

export type Prompt = {
    name: string;
    description: string;
    arguments: {
        name: string;
        type: string
    }[];
    get: (args: Record<string, unknown>) => PromptResult;
};

export type PromptResult = {
    messages: Message[]
};

export type Message = {
    role: string;
    content: string
};

export function createTool<T, R>(
    name: string,
    description: string,
    execute: (args: T) => Promise<R>
): Tool {
    return {
        name,
        description,
        execute: execute as (args: Object) => Promise<unknown>
    };
}

export function createPrompt(
    name: string,
    description: string,
    args: { name: string; type: string }[],
    get: (args: Record<string, unknown>) => { messages: Message[] }
) {
    return {
        name,
        description,
        arguments: args,
        get
    };
}

export default (slices: Record<string, (userId: string) => Slice>, userId: string) => {
    const tools = Object.values(slices)
        .flatMap(s => s(userId).tools);
    const prompts = Object.values(slices)
        .flatMap(s => s(userId).prompts);
            
    return {
        async listResources(): Promise<{ resources: Resource[] }> {
            const resources = await Promise.all(Object.values(slices).flatMap(s => s(userId).list()));

            return { resources: resources.flat() };
        },

        async readResource(uri: string): Promise<{ contents: unknown }> {
            const [name, id] = uri.split('://');
            const slice = slices[name];

            if (!slice) throw new Error('Unknown resource');

            const contents = await slice(userId).read(id);

            return { contents };
        },

        getTools(): { tools: Omit<Tool, 'execute'>[] } {
            return {
                tools: tools.map(tool => ({
                    name: tool.name,
                    description: tool.description
                }))
            };
        },

        async callTool(params: { name: string, arguments: Object }): Promise<unknown> {
            const tool = tools.find(t => t.name === params.name);

            if (!tool) throw new Error('Unknown tool');

            return tool.execute(params.arguments);
        },

        listPrompts(): { prompts: Omit<Prompt, 'get'>[] } {
            return {
                prompts: prompts.map(p => ({
                    name: p.name,
                    description: p.description,
                    arguments: p.arguments
                }))
            };
        },

        getPrompt(params: { name: string, arguments: Object }): PromptResult {
            const prompt = prompts.find(p => p.name === params.name);

            if (!prompt) throw new Error('Unknown prompt');

            return prompt.get(params.arguments);
        }
    };
};