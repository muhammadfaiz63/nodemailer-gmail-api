require("dotenv").config();

const express = require("express");
const proxy = require("express-http-proxy");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require('axios')
const multer = require("multer");
const path = require("path");
const fs = require('fs').promises;
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const {
  OAuth2Client,
} = require('google-auth-library');

var app = express();

const SCOPES = ["https://mail.google.com/",
"https://www.googleapis.com/auth/gmail.addons.current.message.action",
"https://www.googleapis.com/auth/gmail.addons.current.message.metadata",
"https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
"https://www.googleapis.com/auth/gmail.metadata",
"https://www.googleapis.com/auth/gmail.modify",
"https://www.googleapis.com/auth/gmail.readonly"
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

const storage = multer.diskStorage({
  destination: "./repo/pdf",
  filename: function(req, file, cb) {
    //Rename file
    cb(null, "affa-cetak-merek" + "-" + Date.now() + ".pdf");
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
}).single("document")

const oAuth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'postmessage',
  // SCOPES
);

app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const isMultipartRequest = function (req) {
  let contentTypeHeader = req.headers["content-type"];
  return contentTypeHeader && contentTypeHeader.indexOf("multipart") > -1;
};

const bodyParserJsonMiddleware = function () {
  return function (req, res, next) {
    if (isMultipartRequest(req)) {
      app.use(bodyParser.json({ limit: "50mb" }));
      app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
      console.log("this is multipart !");
      return next();
    }
    // app.use(bodyParser.json());
    const hed = req.headers;
    console.log("NOT multipart !", JSON.stringify(hed));
    console.log(JSON.stringify(req.headers));
    if (hed["content-type"] === "text/json") {
      console.log("req = text/json");
      app.use(bodyParser.text({ type: "text/*" }));
    } else {
      console.log("req = JSON");
      app.use(bodyParser.json({ limit: "50mb" }));
      app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
      return bodyParser.json({ limit: "50mb" })(req, res, next);
    }
    return next();
  };
};

app.use(bodyParserJsonMiddleware());

app.use(logger("dev"));

app.post('/auth/google', async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.code); // exchange code for tokens
  console.log(tokens);
  
  res.json(tokens);
});

app.post('/auth/google/refresh-token', async (req, res) => {
  const user = new UserRefreshClient(
    clientId,
    clientSecret,
    req.body.refreshToken,
  );
  const { credentials } = await user.refreshAccessToken(); // optain new tokens
  res.json(credentials);
})

app.get('/getprofilegmail', (req, res) => {
  let userid = "muhammadfaiz7130@gmail.com"
  axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userid}/profile`).then(response => {
    res.json(response)
  }).catch((err) => {
    res.json(err)
  })
})

app.get("/", (req, res) => {
  res.send("Gateway Service is Connected");
});

app.use('/repo', express.static(path.join(__dirname, 'repo')))

const port = process.env.PORT || 1113;

var server = require("http").createServer(app);

server.listen(port, () => {
  console.log(`Gateway Service running on port ${port}`);
});
