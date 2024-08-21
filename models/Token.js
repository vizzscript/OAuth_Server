const { Schema, model } = require('mongoose');

const tokenSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  access_token: { type: String, required: true }, // Updated
  refresh_token: { type: String, required: true }, // Updated
  expirationTime: { type: Number, required: true },
});

module.exports = model('Token', tokenSchema);