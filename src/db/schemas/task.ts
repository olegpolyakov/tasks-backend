import { Schema } from 'mongoose';

import { RecurrenceFrequency } from '@olegpolyakov/core';
import { Task } from '@olegpolyakov/tasks-core';

const TaskSchema = new Schema<Task>({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    important: { type: Boolean, default: false },
    dueDate: { type: Date },
    content: { type: String },
    recurrence: {
        type: {
            frequency: {
                type: String,
                enum: [
                    RecurrenceFrequency.Daily,
                    RecurrenceFrequency.Weekly,
                    RecurrenceFrequency.Monthly,
                    RecurrenceFrequency.Yearly
                ]
            },
            interval: { type: Number, default: 1 },
            values: { type: [Number] }
        },
        default: undefined
    },
    tagIds: { type: [String], default: [] },
    childrenIds: { type: [String] },
    userId: { type: String, required: true }
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

export default TaskSchema;