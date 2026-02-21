const mongoose = require('mongoose');
const { Schema } = mongoose;

const swipeSchema = new Schema({
    swiper: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['like', 'pass'], required: true },
}, { timestamps: true });

// Prevent duplicate swipes
swipeSchema.index({ swiper: 1, target: 1 }, { unique: true });

module.exports = mongoose.model('Swipe', swipeSchema);
