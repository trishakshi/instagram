'use strict';

require('dotenv').config()
const express = require('express');
const cors = require('cors');
const imageUpload = require('./routes/imageRoute')
const videoUpload = require('./routes/videoRoute')
const authRoute = require('./routes/UserRouter')
const postRoute = require('./routes/PostRouter')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')

const port = process.env.PORT || 5000;
const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://sogram.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.listen(port, () =>
  console.log(`server is listening on url http:localhost:${port}`)
);

mongoose.connect(process.env.MONGO_URI, () => {
  console.log(`Connected to Instagram...`)
})

app.use("/auth", authRoute);
app.use('/image', imageUpload)
app.use('/video', videoUpload)
app.use("/", postRoute);
