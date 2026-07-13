import { createDb, Models as BaseModels, Options } from '@olegpolyakov/db';

import * as schemas from './schemas/index.ts';

export type Schemas = typeof schemas;
export type Models = BaseModels<Schemas>;

export { schemas };

export default (connectionString: string, options: Options) => createDb(connectionString, schemas, options);