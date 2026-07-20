import { type Model, Schema } from 'mongoose';

import type { ProjectData, ProjectSectionData, Task } from '@olegpolyakov/tasks-core';

type ProjectVirtuals = {
    id: string;
    tasks: Task[]
};

type ProjectModel = Model<ProjectData>;

export const ProjectSectionSchema = new Schema<ProjectSectionData>({
    name: { type: String, required: true },
    taskIds: { type: [String], default: [] }
});

const ProjectSchema = new Schema<ProjectData, ProjectModel, {}, {}, ProjectVirtuals>({
    name: { type: String, required: true },
    icon: { type: String },
    description: { type: String },
    taskIds: { type: [String], default: [] },
    sectionIds: { type: [String], default: [] },
    sectionData: {
        type: Map,
        of: ProjectSectionSchema,
        default: {}
    }
}, {
    timestamps: true
});

ProjectSchema.virtual('tasks', {
    ref: 'Task',
    localField: 'taskIds',
    foreignField: '_id'
});

export default ProjectSchema;