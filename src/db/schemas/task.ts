import { Schema } from 'mongoose';

import { RecurrenceFrequency } from '@olegpolyakov/core';
import { Task, TaskPriority } from '@olegpolyakov/tasks-core';

const TaskSchema = new Schema<Task>({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    content: { type: String },
    dueDate: { type: Date },
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
    priority: {
        type: Number,
        enum: [
            TaskPriority.Low,
            TaskPriority.Medium,
            TaskPriority.High
        ],
        default: TaskPriority.Medium
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

export default TaskSchema;