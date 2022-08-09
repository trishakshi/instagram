'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const Auth = require('../middleware/Auth');
const { Video, Comment } = require('../models/PostModel');
const User = require('../models/UserModel');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/instagram-react/backend/uploads/videos/');
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post('/', upload.single('file'), Auth, async (req, res) => {
  try {
    const newUpload = new Video({
      userID: req.user,
      video: req.file.originalname,
      desc: req.body.desc,
      comments: [],
    });

    const savedUpload = await newUpload.save();
    res.json(savedUpload);
  } catch (err) {
    res.status(500).send();
  }
});

// get videos of the logged user and friends they are following
router.get('/video_timeline', Auth, async (req, res) => {
  try {
    const loggedUser = await User.findById({ _id: req.user });
    const loggedUserPosts = await Video.find({ userID: loggedUser._id });
    const friendPosts = await Promise.all(
      loggedUser.following.map((friendId) => {
        return Video.find({ userID: friendId });
      })
    );
    res.json(loggedUserPosts.concat(...friendPosts));
  } catch (err) {
    return res.status(500).send();
  }
});

// getting a single video
router.get('/:id/video', async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById({ _id: videoId });
    res.json(video);
  } catch (err) {
    return res.status(500).send();
  }
});

// post a comment for a video
router.post('/:id/comment_on_video', Auth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const { comment } = req.body;

    const loggedUser = await User.findOne({ _id: req.user });
    const currentVideo = await Video.findOne({ _id: videoId });

    const newComment = new Comment({
      userID: req.user,
      comment,
      username: loggedUser.username,
    });

    if (currentVideo) {
      currentVideo.comments.push(newComment);
      currentVideo.save();
      res.json(currentVideo);
    }
  } catch (err) {
    return res.status(500).send();
  }
});

// like a video
router.put('/:id/like_a_video', Auth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const existingVideo = await Video.findById(videoId);

    if (!existingVideo.likes.includes(req.user)) {
      await existingVideo.updateOne({ $push: { likes: req.user } });
      res.status(200).json('You liked this video.');
    } else {
      await existingVideo.updateOne({ $pull: { likes: req.user } });
      res.status(200).json('You disliked this video.');
    }
  } catch (err) {
    res.status(500).send();
  }
});

// delete a video
router.delete('/:id/delete_video', async (req, res) => {
  try {
    const videoId = req.params.id;
    const existingVideo = await Video.findOne({ _id: videoId });

    if (!existingVideo) {
      return res.status(400).json({ err: 'Video has already been deleted.' });
    }

    existingVideo.delete();
    res.json(existingVideo);
  } catch (err) {
    res.status(500).send();
  }
});
module.exports = router;
