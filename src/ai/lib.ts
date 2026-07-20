export type DataType = Boolean | Integer | String | Object | Array;
export type ValueType = 'boolean' | 'number' | 'string';

export type Boolean = {
    type: 'boolean';
    description?: string;
};

export type Integer = {
    type: 'integer';
    description?: string;
    minimum?: number;
    maximum?: number;
};

export type String = {
    type: 'string';
    description?: string;
    format?: string;
    enum?: string[];
};

export type Object = {
    type: 'object';
    properties: Record<string, DataType>;
    description?: string;
    required?: string[];
};

export type Array = {
    type: 'array';
    items: {
        type: ValueType;
    }
    description?: string;
    uniqueItems?: boolean;
};

export type ToolDefinition = {
    type: 'function', // always function
    function: {
        name: string;
        description: string;
        parameters: Object;
    }
}

// TODO Replace any
export class Tool<T extends (args: any) => Promise<string> = (args: any) => Promise<string>> {
    constructor(
        public name: string,
        public description: string,
        protected parameters: Record<string, DataType>,
        protected fn: T
    ) {}

    get definition(): ToolDefinition {
        return {
            type: 'function',
            function: {
                name: this.name,
                description: this.description,
                parameters: {
                    type: 'object',
                    required: Object.keys(this.parameters)
                        .filter(key => key.endsWith('!'))
                        .map(key => key.slice(0, -1)),
                    properties: Object.entries(this.parameters)
                        .reduce((acc, [name, def]) => ({
                            ...acc,
                            [name.endsWith('!') ? name.slice(0, -1) : name]: def
                        }), {})
                }
            }
        };
    }

    // TODO Replace any
    call(args: any): Promise<string> {
        return this.fn(args);
    }
}

export function boolean(description: string): Boolean {
    return {
        type: 'boolean',
        description
    };
}

export function integer(
    description: string,
    options: {
        minimum?: number;
        maximum?: number
    } = {}
): Integer {
    return {
        type: 'integer',
        description,
        ...options
    };
}

export function string(
    description: string,
    options: {
        format?: string;
        enum?: string[]
    } = {}
): String {
    return {
        type: 'string',
        description,
        ...options
    };
}

export function object(description: string, fields: Record<string, DataType>): Object {
    return {
        type: 'object',
        description,
        required: Object.keys(fields)
            .filter(key => key.endsWith('!'))
            .map(key => key.slice(0, -1)),
        properties: Object.entries(fields)
            .reduce((acc, [name, def]) => ({
                ...acc,
                [name.endsWith('!') ? name.slice(0, -1) : name]: def
            }), {})
    };
}

export function array(
    description: string,
    type: ValueType,
    options: {
        uniqueItems?: boolean
    } = {}
): Array {
    return {
        type: 'array',
        description,
        items: {
            type
        },
        ...options
    };
}