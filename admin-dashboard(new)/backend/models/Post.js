const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    content: { type: String, required: true },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
