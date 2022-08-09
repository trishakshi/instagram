'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const Auth = require("../middleware/Auth");
const {Image, Comment} = require('../models/PostModel');
const User = require("../models/UserModel");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/instagram-react/backend/uploads/images/');
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post('/', upload.single('file'),Auth, async (req, res) => {
  try {
    const newUpload = new Image({
      userID: req.user,
      image: req.file.originalname,
      desc: req.body.desc,
      comments: [],
    });

    const savedUpload = await newUpload.save();
    res.json(savedUpload);
  } catch (err) {
    res.status(500).send();
  }
});

// get registered user's and friend's posted images
router.get("/image_timeline", Auth, async (req, res) => {
  try {
    const loggedUser = await User.findById({ _id: req.user });
    const loggedUserPosts = await Image.find({ userID: loggedUser._id });
    const friendPosts = await Promise.all(
      loggedUser.following.map((friendId) => {
        return Image.find({ userID: friendId });
      })
    );
    res.json(loggedUserPosts.concat(...friendPosts));
  } catch (err) {
    return res.status(500).send();
  }
});

// get a single image
router.get("/image/:id", async (req, res) => {
  try {
    const imageId = req.params.id;
    const image = await Image.findById({ _id: imageId });
    res.json(image);
  } catch (err) {
    return res.status(500).send();
  }
});

// comment on an image
router.post("/:id/comment_on_image", Auth, async (req, res) => {
  try {
    const imageId = req.params.id;
    const { comment } = req.body;

    const loggedUser = await User.findOne({ _id: req.user });
    const currentImage = await Image.findOne({ _id: imageId });

    const newComment = new Comment({
      userID: req.user,
      comment,
      username: loggedUser.username,
    });

    if (currentImage) {
      currentImage.comments.push(newComment);
      currentImage.save();
      res.json(currentImage);
    }
  } catch (err) {
    return res.status(500).send();
  }
});

// like an image
router.put("/:id/like_an_image", Auth, async (req, res) => {
  try {
    const imageId = req.params.id;
    const existingImage = await Image.findById({ _id: imageId });
    if (!existingImage.likes.includes(req.user)) {
      await existingImage.updateOne({ $push: { likes: req.user } });
      res.status(200).json("You liked this image");
    } else {
      await existingImage.updateOne({ $pull: { likes: req.user } });
      res.status(200).json("You disliked this image");
    }
  } catch (err) {
    res.status(500).send();
  }
});

// delete an image(only registered user can delete their images)
router.delete("/:id/delete_image", async (req, res) => {
  try {
    const imageId = req.params.id;
    const existingImage = await Image.findOne({ _id: imageId });

    if (!existingImage) {
      return res.status(400).json({ err: "Image has already been deleted." });
    }

    existingImage.delete();
    res.json(existingImage);
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
