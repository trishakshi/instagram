const Auth = require("../middleware/Auth");
const { Image, Video } = require("../models/PostModel");
const User = require("../models/UserModel");
const router = require("express").Router();

// getting posts of registered user
router.get("/:id/profile", async (req, res) => {
  try {
    const id = req.params.id;
    const foundUser = await User.findOne({ _id: id });
    const foundUser_images = await Image.find({ userID: id });
    const foundUser_videos = await Video.find({ userID: id });
    res.json({ foundUser, foundUser_images, foundUser_videos });
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
