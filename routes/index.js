var express = require('express');
var cors = require('cors')
var router = express.Router();

var corsOptions = {
  origin: 'http://localhost:4200', 
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

/* GET home page. */
router.get('/topstories.json', cors(corsOptions), function(req, res, next) {
  const print = req.query.print;
  const arr = [12, 13, 14, 15, 16];
  res.send(arr);
});

module.exports = router;
