const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: { type: String, required: true },
    fullName: { type: String, required: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String },
    followers: { type: Array, default: [] },
    following: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
