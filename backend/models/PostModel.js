const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const commentSchema = new Schema(
  {
    userID: { type: ObjectId },
    comment: { type: String },
    username: { type: String },
  },
  {
    timestamps: true,
  }
);

const imageSchema = new Schema(
  {
    userID: { type: ObjectId },
    image: { type: String },
    desc: { type: String },
    likes: { type: Array, default: [] },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

const videoSchema = new Schema(
  {
    userID: { type: ObjectId },
    video: { type: String },
    desc: { type: String },
    likes: { type: Array, default: [] },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model("Comment", commentSchema);
const Image = mongoose.model("Image", imageSchema);
const Video = mongoose.model("Video", videoSchema);

module.exports = {
  Comment: Comment,
  Image: Image,
  Video: Video,
};
