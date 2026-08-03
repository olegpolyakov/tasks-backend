import { type ChatResponse, Message, Ollama } from 'ollama';

import type Context from '@/context.ts';

import type { Tool } from './lib.ts';

export interface Agent {
    chat(
        userId: string,
        messages: Message[],
        options?: {
            model?: string;
            stream?: boolean;
        }
    ): Promise<ChatResponse>;
    loop(messages: Message[], model: string): Promise<ChatResponse>;
    call(name: string, args: unknown): unknown;
}

export default (context: Context, tools: Record<string, Tool>): Agent => {
    const ollama = new Ollama({
        host: 'https://ollama.com',
        headers: {
            Authorization: `Bearer ${context.config.OLLAMA_TOKEN}`
        }
    });
    const definitions = Object.values(tools).map(tool => tool.definition);

    return {
        async chat(
            userId,
            messages,
            {
                model = 'gemma4:31b-cloud',
                stream = false
            } = {}
        ) {
            if (!userId) {
                throw new Error('User ID is required');
            }

            if (!messages) {
                throw new Error('Messages are required');
            }

            const prompt = messages.find(m => m.role === 'system');

            if (!prompt || prompt.content === '') {
                messages.unshift({
                    role: 'system',
                    content: `User ID: ${userId}`
                });
            } else {
                prompt.content = `User ID: ${userId}\n${prompt.content}`;
            }

            // TODO Enable streaming
            // if (stream) {            
            //     const response = await ollama.chat({
            //         messages,
            //         model,
            //         stream: true,
            //         tools: definitions
            //     });
            
            //     for await (const chunk of response) {
            //         res.write(JSON.stringify(chunk.message) + '\n'); 
            //     }
    
            //     res.end();
            // }

            return this.loop(messages, model);
        },

        async loop(messages, model) {
            const response = await ollama.chat({
                model,
                messages,
                tools: definitions
            });

            if (!response.message.tool_calls) {
                return response;
            }

            messages.push(response.message);

            for (const call of response.message.tool_calls) {
                try {
                    const result = await this.call(
                        call.function.name,
                        call.function.arguments
                    );

                    messages.push({
                        role: 'tool',
                        tool_name: call.function.name,
                        content: String(result)
                    });
                } catch (error) {
                    console.error(error);
                    messages.push({
                        role: 'tool',
                        tool_name: call.function.name,
                        content: `${(error as Error).name} ${(error as Error).message}`
                    });
                }
            }

            return this.loop(messages, model);
        },

        call(name, args) {
            const tool = tools[name];

            if (!tool) throw new Error('Unknown tool');

            return tool.call(args);
        }
    } satisfies Agent;
};
