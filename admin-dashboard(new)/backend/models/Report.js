const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, required: true, maxlength: 500 },
    location: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], index: '2dsphere' },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
    status: { type: String, default: 'pending', enum: ['pending', 'verified', 'in-progress', 'resolved', 'rejected'] },
    images: { type: [String], default: [] },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
