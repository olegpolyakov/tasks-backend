import type { TasksSettings } from '@olegpolyakov/tasks-core';
import { createSettingsSchema } from '@olegpolyakov/backend/features/settings';

export default createSettingsSchema<TasksSettings>({
    listsOrder: { type: [String], default: [] },
    tagsOrder: { type: [String], default: [] },
    tasksOrder: { type: Object, default: {} },
    tasksSort: { type: Object, default: {} }
});
