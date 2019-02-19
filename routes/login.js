var express = require('express');
var router = express.Router();
var passwordHash = require('password-hash');
var db = require('./db');
/* GET home page. */
router.get('/', checkAuth, function(req, res, next) {
  res.render('login');
});

router.post('/check', function ( req, res, next) {
  var stdId = req.body.stdId;
  var pass = req.body.password;
  var cypherQuery = "MATCH (u:user {user_id:{stdId}}) RETURN u";
  db.query(cypherQuery, {stdId: stdId}, function(err, results) {
    if (err) {
        console.error('Error saving new node to database:', err);
    } else {
      if(passwordHash.verify(stdId + pass , results[0].pass)) {
        if (results[0].status == 1) {
          req.session.uId = results[0].user_id;
          req.session.name = results[0].fname + ' ' + results[0].lname;
          req.session.position = results[0].position;
          req.session.dpt = results[0].department;
          res.redirect('/admin');
        } else {
          req.flash('error', '  ไอดีที่ท่านใช้ถูกปิดกั้นจากระบบ');
          res.redirect('/');
        }
      } else {
        req.flash('error', '  ไอดีหรือรหัสผ่านไม่ถูกต้อง');
        res.redirect('/');
      }
    }
  });
});

function checkAuth(req, res, next) {
  if (!req.session.uId) {
    next();
  } else {
    res.redirect('/admin');
  }
}

module.exports = router;
