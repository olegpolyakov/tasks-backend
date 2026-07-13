import { createSettingsSchema } from '@olegpolyakov/db/schemas/settings';
import type { TasksSettings } from '@olegpolyakov/tasks-core';

export default createSettingsSchema<TasksSettings>({
    listsOrder: { type: [String], default: [] },
    tagsOrder: { type: [String], default: [] },
    tasksOrder: { type: Object, default: {} },
    tasksSort: { type: Object, default: {} }
});
