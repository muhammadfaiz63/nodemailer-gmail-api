require("dotenv").config();

const express = require("express");
const proxy = require("express-http-proxy");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require('axios')
const multer = require("multer");
const fs = require('fs');
const path = require("path");

var app = express();

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


app.get("/", (req, res) => {
  res.send("Gateway Service is Connected");
});

app.use('/repo', express.static(path.join(__dirname, 'repo')))

const port = process.env.PORT || 1112;

var server = require("http").createServer(app);

server.listen(port, () => {
  console.log(`Gateway Service running on port ${port}`);
});
