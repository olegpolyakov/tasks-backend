import { Schema } from 'mongoose';

import type { Tag } from '@olegpolyakov/tasks-core';

const TagSchema = new Schema<Tag>({
    name: { type: String, required: true },
    icon: { type: String },
    userId: { type: String, required: true }
}, {
    timestamps: true
});

TagSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'tagIds'
});

TagSchema.virtual('tasksCount', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'tagIds',
    count: true
});

export default TagSchema;