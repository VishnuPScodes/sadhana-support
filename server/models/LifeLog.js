const mongoose = require('mongoose');

const lifeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // stored as YYYY-MM-DD
    required: true,
  },
  answers: {
    innerEngineeringCount: { type: Number, min: 1, max: 5, default: 1 },
    consciousEating: { type: String, enum: ['Yes', 'No'], default: 'No' },
    reactOrRespond: { type: String, enum: ['Reacting', 'Responding'], default: 'Reacting' },
    moreWilling: { type: String, enum: ['Yes', 'No'], default: 'No' },
    systemVibrant: { type: String, enum: ['Yes', 'No'], default: 'No' },
    vakshudhiRating: { type: String, enum: ['Bad', 'Okay', 'Good'], default: 'Okay' },
  },
  totalLifeScore: { type: Number, default: 0 },
}, { timestamps: true });

// One life log per user per day
lifeLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LifeLog', lifeLogSchema);
