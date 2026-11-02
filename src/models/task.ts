import { Schema } from 'mongoose';

import { Task } from '@olegpolyakov/tasks-core';
import { RecurrenceSchema, RefSchema } from '@olegpolyakov/backend/db/schemas';

export const TaskSchema = new Schema<Task>({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    important: { type: Boolean, default: false },
    date: { type: Date },
    recurrence: { type: RecurrenceSchema, default: undefined },
    content: { type: String },
    tagIds: { type: [String], default: [] },
    childrenIds: { type: [String] },
    userId: { type: String, required: true, immutable: true },
    refs: { type: [RefSchema], default: [] }
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