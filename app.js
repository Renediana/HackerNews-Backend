var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var router = express.Router();
var https = require("node-fetch");

var app = express();
app.use(cookieParser());
app.use(cors({ 
  origin: 'http://bonenga.ddns.net:4200', 
  credentials: true, 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200
 }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const ROOT_URL = "https://hacker-news.firebaseio.com/v0/";

var topstories = {};
var votes = {};

https(ROOT_URL + "topstories.json")
  .then((res) => res.json())
  .then((ids) => {
    ids.forEach((id) => {
      https(ROOT_URL + `item/${id}.json`)
        .then((res) => res.json())
        .then((story) => {
          topstories[story.id] = story;
          console.log(story.id);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  })
  .catch((err) => {
    console.log(err);
  });
   
   app.get('/products/:id', function (req, res, next) {
    res.json({msg: 'This is CORS-enabled for all origins!'})
  })

  
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://bonenga.ddns.net:4200");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "application/x-www-form-urlencoded, multipart/form-data, text/plain, Origin, X-Requested-With, Content-Type, Accept, Cache-Control");
  res.header("Access-Control-Allow-Credentials", true);

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
});

app.use(function (req, res, next) {
  // check if client sent cookie
  console.log(req.cookies);
  var cookie = req.cookies.voterID;
  if (cookie === undefined) {
    // no: set a new cookie
    var randomNumber = Math.random().toString();
    randomNumber = randomNumber.substring(2, randomNumber.length);
    res.cookie("voterID", randomNumber, { maxAge: 900000, httpOnly: false });
    console.log("cookie created successfully");
  } else {
    // yes, cookie was already present
    console.log("cookie exists", cookie);
  }
  next(); // <-- important!
});

/* GET home page. */
app.get("/topstories.json", function (req, res, next) {
  res.send(Object.keys(topstories));
});

app.get("/item/:id.json", function (req, res, next) {
  res.send(topstories[req.params.id]);
});

app.get("/item/:id/upvote", (req, res) => {
  console.log(req.cookies);
  var cookie = req.cookies.voterID;
  var users = votes[req.params.id] !== undefined ? votes[req.params.id] : {};
  users[cookie] = 1;
  votes[req.params.id] = users;
  res.send();
});

app.get("/item/:id/downvote", (req, res) => {
  var cookie = req.cookies.voterID;
  var users = votes[req.params.id] !== undefined ? votes[req.params.id] : {};
  users[cookie] = -1;
  votes[req.params.id] = users;
  res.send();
});

app.get("/item/:id/resetvote", (req, res) => {
  var cookie = req.cookies.voterID;
  var users = votes[req.params.id] !== undefined ? votes[req.params.id] : {};
  users[cookie] = undefined;
  votes[req.params.id] = users;
  res.send();
});


app.get("/votes", (req, res) => {
  res.send(votes);
  console.log(req.cookies);
});

app.post("/votes", cors({ origin: "http://localhost:4200"}), (req, res, next) => {
  const result = req.body.reduce((total, current) => {
    var totalVotes = votes[current] !== undefined ? Object.values(votes[current]).reduce((sum, vote) => {
      return vote !== undefined ? sum + vote : sum;
    }, 0) : 0;
    total[current] = {
        total: totalVotes,
        myVote: votes[current] !== undefined ? votes[current][req.cookies.voterID] : undefined
    };
    return total;
  }, {});
  res.send(result);
  next()
});

module.exports = app;
