require('dotenv').config();
const User = require('../models/UserModel');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Auth = require('../middleware/Auth');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/instagram-react/backend/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// getting all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).send();
  }
});

// get friends registered user is following
router.get('/following_timeline', Auth, async (req, res) => {
  try {
    const loggedUser = await User.findById({ _id: req.user });
    const friendsInfo = await Promise.all(
      loggedUser.following.map((friendID) => {
        return User.findById({ _id: friendID });
      })
    );
    res.json(friendsInfo);
  } catch (err) {
    res.status(500).send();
  }
});

// get friends registered user is following
router.get('/followers_timeline', Auth, async (req, res) => {
  try {
    const loggedUser = await User.findById({ _id: req.user });
    const friendsInfo = await Promise.all(
      loggedUser.followers.map((friendID) => {
        return User.findById({ _id: friendID });
      })
    );
    res.json(friendsInfo);
  } catch (err) {
    res.status(500).send();
  }
});

router.get('/loggedUser', Auth, async (req, res) => {
  try {
    const loggedUser = await User.findOne({ _id: req.user });
    const { passwordHash, ...others } = loggedUser._doc;
    res.json({ ...others });
  } catch (err) {
    res.status(500).send();
  }
});

// user signup
router.post('/register', async (req, res) => {
  try {
    const { email, fullName, username, password } = req.body;

    if (!email || !fullName || !username || !password) {
      return res.status(400).json({ err: 'Incomplete user data.' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ err: 'Password must be at least six characters long.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ err: 'Account already exists.' });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      fullName,
      username,
      avatar: '',
      bio: '',
      passwordHash,
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      {
        id: savedUser._id,
      },
      process.env.JWT_SECRET
    );

    res
      .cookie('token', token, {
        maxAge: 72 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite:
          process.env.NODE_ENV === 'development'
            ? 'lax'
            : process.env.NODE_ENV === 'production' && 'none',
        secure:
          process.env.NODE_ENV === 'development'
            ? 'false'
            : process.env.NODE_ENV === 'production' && 'true',
      })
      .send();
  } catch (err) {
    return res.status(500).send();
  }
});

// user signin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ err: 'Incomplete user data.' });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ err: 'Incorrect username or password.' });
    }

    const correctPassword = await bcrypt.compare(
      password,
      existingUser.passwordHash
    );
    if (!correctPassword) {
      return res.status(400).json({ err: 'Incorrect email or password.' });
    }

    const token = jwt.sign(
      {
        id: existingUser._id,
      },
      process.env.JWT_SECRET
    );

    res
      .cookie('token', token, {
        maxAge: 72 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite:
          process.env.NODE_ENV === 'development'
            ? 'lax'
            : process.env.NODE_ENV === 'production' && 'none',
        secure:
          process.env.NODE_ENV === 'development'
            ? 'false'
            : process.env.NODE_ENV === 'production' && 'true',
      })
      .send();
  } catch (err) {
    return res.status(500).send();
  }
});

// getting logged in user
router.get('/log_in', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.json(null);
    }

    const validatedUser = jwt.verify(token, process.env.JWT_SECRET);

    res.json(validatedUser.id);
  } catch (err) {
    return res.json(null);
  }
});

// user logout
router.get('/log_out', async (req, res) => {
  try {
    res
      .cookie('token', '', {
        httpOnly: true,
        sameSite:
          process.env.NODE_ENV === 'development'
            ? 'lax'
            : process.env.NODE_ENV && 'none',
        secure:
          process.env.NODE_ENV === 'development'
            ? 'false'
            : process.env.NODE_ENV === 'production' && 'true',
        expires: new Date(0),
      })
      .send();
  } catch (err) {
    return res.json(null);
  }
});

// edit user info
router.put('/edit', upload.single('file'), Auth, async (req, res) => {
  try {
    const { fullName, username, bio } = req.body;

    const avatar = req.file.originalname;

    const loggedUser = await User.findOne({ _id: req.user });
    if (!loggedUser) {
      res.status(400).json({ err: 'Unauthorized.' });
    }

    loggedUser.fullName = fullName;
    loggedUser.username = username;
    loggedUser.avatar = avatar;
    loggedUser.bio = bio;

    await loggedUser.save();
    // console.log(updatedUserInfo);

    res.json(loggedUser);
  } catch (err) {
    res.status(500).send();
  }
});

// follow a friend
router.put('/:id/follow', Auth, async (req, res) => {
  try {
    const friendId = req.params.id;
    const loggedUserId = req.user;

    if (loggedUserId !== friendId) {
      const friend = await User.findById(friendId);
      const loggedUser = await User.findById(loggedUserId);
      if (!friend.followers.includes(loggedUserId)) {
        await friend.updateOne({ $push: { followers: loggedUserId } });
        await loggedUser.updateOne({ $push: { following: friendId } });
        res
          .status(200)
          .json({ message: `You are following ${friend.fullName}.` });
      } else {
        res
          .status(403)
          .json({ message: `You already follow ${friend.fullName}.` });
      }
    } else {
      res.status(403).json({ message: `You can't follow yourself.` });
    }
  } catch (err) {
    res.status(500).send();
  }
});

// unfollow a friend
router.put('/:id/unfollow', Auth, async (req, res) => {
  try {
    const friendId = req.params.id;
    const loggedUserId = req.user;

    if (loggedUserId !== friendId) {
      const friend = await User.findById(friendId);
      const loggedUser = await User.findById(loggedUserId);
      if (friend.followers.includes(loggedUserId)) {
        await friend.updateOne({ $pull: { followers: loggedUserId } });
        await loggedUser.updateOne({ $pull: { following: friendId } });
        res
          .status(200)
          .json({ message: `You have unfollowed ${friend.fullName}.` });
      } else {
        res
          .status(403)
          .json({ message: `You don't follow ${friend.fullName}.` });
      }
    } else {
      res.status(403).json({ message: `You can't unfollow yourself.` });
    }
  } catch (err) {
    res.status(500).send();
  }
});

// remove a follower
router.put('/:id/remove', Auth, async (req, res) => {
  try {
    const followerId = req.params.id;

    const loggedUserId = req.user;

    if (loggedUserId !== followerId) {
      const follower = await User.findById(followerId);

      const loggedUser = await User.findById(loggedUserId);

      if (loggedUser.followers.includes(followerId)) {
        await loggedUser.updateOne({ $pull: { followers: followerId } });
        res
          .status(200)
          .json({ message: `You have removed ${follower.fullName}.` });
      } else {
        res
          .status(403)
          .json({ message: `You don't follow ${follower.fullName}.` });
      }
    } else {
      res.status(403).json({ message: `You can't remove yourself.` });
    }
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
