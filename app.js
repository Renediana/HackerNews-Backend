var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
var router = express.Router();
var https = require('node-fetch');

var app = express();
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const ROOT_URL = "https://hacker-news.firebaseio.com/v0/";

var topstories = {};
var votes = {};

https(ROOT_URL + 'topstories.json?print=pretty')
    .then(res => res.json())
    .then(ids => {
        ids.forEach(id => {
            https(ROOT_URL + `item/${id}.json?print=pretty`)
            .then(res => res.json())
            .then(story => {
                topstories[story.id] = story;
                console.log(story.id);
            })
            .catch(err => {
                console.log(err);
            });
        });
    })
    .catch(err => {
        console.log(err);
    });

var corsOptions = {
  origin: '*', 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

/* GET home page. */
app.get('/topstories.json', cors(corsOptions), function(req, res, next) {
  res.send(Object.keys(topstories));
});

app.get('/item/:id.json', cors(corsOptions), function(req, res, next) {
    res.send(topstories[req.params.id]);
  });

app.get('/item/:id/upvote', cors(corsOptions), (req, res) => {
    votes[req.params.id] = 1;
    res.send();
});

app.get('/item/:id/downvote', cors(corsOptions), (req, res) => {
    votes[req.params.id] = -1;
    res.send();
});

app.get('/item/:id/resetvote', cors(corsOptions), (req, res) => {
    votes[req.params.id] = undefined;
    res.send();
});

app.get('/votes', cors(corsOptions), (req, res) => {
    res.send(votes);
})

app.post('/votes', cors(corsOptions), (req, res) => {
    const result = req.body.reduce( (total, current) => {
        total[current] = votes[current];
        return total;
    }, {});
    res.send(result);
});

module.exports = app;
