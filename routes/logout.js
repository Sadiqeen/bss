var express = require('express');
var router = express.Router();

router.get('/', checkAuth, function(req, res, next) {
  req.session.destroy();
  res.redirect('/');

  
});

function checkAuth(req, res, next) {
  if (!req.session.uId) {
    res.redirect('/');
  } else {
    next();
  }
}

module.exports = router;
