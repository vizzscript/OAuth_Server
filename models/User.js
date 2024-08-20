// models/User.js
const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // You can store tokens directly here if you want
  accessToken: { type: String },
  refreshToken: { type: String },
  expirationTime: { type: Number },
});

module.exports = model('User', userSchema);
