const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
    username: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('BlogPost', blogPostSchema);
