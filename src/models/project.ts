import { type Model, Schema } from 'mongoose';

import type { ProjectData, ProjectSectionData, Task } from '@olegpolyakov/tasks-core';

type ProjectModel = Model<Omit<ProjectData, 'sectionData'> & {
    sectionData: Map<string, ProjectSectionData>
}>;

type ProjectVirtuals = {
    id: string;
    tasks: Task[]
};

export const ProjectSectionSchema = new Schema<ProjectSectionData>({
    name: { type: String, required: true },
    icon: { type: String },
    taskIds: { type: [String], default: [] }
});

export const ProjectSchema = new Schema<ProjectData, ProjectModel, object, object, ProjectVirtuals>({
    name: { type: String, required: true },
    description: { type: String },
    content: { type: String },
    icon: { type: String },
    taskIds: { type: [String], default: [] },
    sectionIds: { type: [String], default: [] },
    sectionData: { type: Object, default: {} },
    userId: { type: String, required: true, immutable: true }
}, {
    timestamps: true,
    minimize: false // this is needed, otherwise empty `sectionData` is removed from the doc
});

ProjectSchema.virtual('tasks', {
    ref: 'Task',
    localField: 'taskIds',
    foreignField: '_id'
});