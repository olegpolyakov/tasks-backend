import { Schema } from 'mongoose';

import { RecurrenceData, RecurrenceFrequency } from '@olegpolyakov/core';

const Recurrence = new Schema<RecurrenceData>({
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
}, {
    _id: false,
    id: false
});

export default Recurrence;