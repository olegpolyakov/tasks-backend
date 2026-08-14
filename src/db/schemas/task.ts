import { Schema } from 'mongoose';

import { Task } from '@olegpolyakov/tasks-core';

import Recurrence from './recurrence.ts';

const TaskSchema = new Schema<Task>({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    important: { type: Boolean, default: false },
    date: { type: Date },
    recurrence: { type: Recurrence, default: undefined },
    content: { type: String },
    tagIds: { type: [String], default: [] },
    childrenIds: { type: [String] },
    userId: { type: String, required: true, immutable: true }
}, {
    timestamps: true
});

TaskSchema.virtual('tags', {
    ref: 'Tag',
    localField: 'tagIds',
    foreignField: '_id'
});

TaskSchema.virtual('projects', {
    ref: 'Project',
    localField: '_id',
    foreignField: 'taskIds',
    options: {
        projection: 'name'
    }
});

TaskSchema.method('getNextDate', function() {
    return new Task(this.toObject()).getNextDate();
});

export default TaskSchema;