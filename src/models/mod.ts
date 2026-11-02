import { createModels, Db, Models as _Models } from '@olegpolyakov/backend/db';

import { ProjectSchema as Project } from './project';
import { SettingsSchema as Settings } from './settings';
import { TagSchema as Tag } from './tag';
import { TaskSchema as Task } from './task';

const schemas = {
    Project,
    Settings,
    Tag,
    Task
};

export type Models = _Models<typeof schemas>;

export default (db: Db) => createModels(db.connection, schemas);