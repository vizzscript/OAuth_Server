const { Schema, model } = require('mongoose');

const tokenSchema = new Schema({
  userId: { type: String, required: true, unique: true, trim: true },
  access_token: { type: String, required: true },
  refresh_token: { type: String, required: true },
  expirationTime: { type: Number, required: true },
}, { timestamps: true });

module.exports = model('Token', tokenSchema);
