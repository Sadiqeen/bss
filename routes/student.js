var express = require('express');
var router = express.Router();
var db = require('./db');
let date = require('date-and-time');
/* GET home page. */
router.get('/', checkAuth, function(req, res, next) {
  var cypherQuery = "MATCH (b:bic)<-[:type_of]-(t:type) RETURN b { .bId, .color,type : (t { .name})}";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      res.render('student/req', { title : 'หน้าแรก', name : req.session.name , department : req.session.dpt , data : results });
    }
  });
});

router.get('/br/:bId', checkAuth, function(req, res, next) {
  var bId = req.params.bId;
  var cypherQuery = "MATCH p = (u:user {user_id:'" + req.session.uId + "'})-[r:borrow {status:'1'}]->() RETURN p";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      if (Object.keys(results).length > 0) {
        req.flash('error', '  ท่านได้ยืมจักรยาน และไม่ปรากฏสถานะการคืนในระบบ กรุณาทำการคืนก่อนยืมครั้งต่อไป หรือติดต่อเจ้าหน้าที่หากมีข้อผิดพลาด')
        res.redirect('/student');
      } else {
        var cypherQuery = "MATCH (b:bic {bId:'" + bId + "'})<-[:type_of]-(t:type) RETURN b { .bId, .color,type : (t { .name})}";
        db.query(cypherQuery, function(err, results) {
          console.log(results);
          if (err) {
            console.error('Error saving new node to database:', err);
          } else {
            res.render('student/br', {title:'ทำรายการยืม', name : req.session.name ,
              department : req.session.dpt , data : results[0], br_date: date.format(new Date(), 'DD/MM/YYYY'),
               re_date: date.format(date.addDays(new Date(), 7), 'DD/MM/YYYY')});
          }
        });
      }
    }
  });
});

router.post('/brcf', checkAuth, function(req, res, next) {
  var bId = req.body.bId;
  var br = req.body.br;
  var re = req.body.re;
  var cypherQuery = "MATCH (u:user {user_id:'" + req.session.uId + "'}),(b:bic {bId:'" + bId + "'}) CREATE (u)-[:borrow {br_date:'" + br + "',re_date:'" + re + "',status:'1'}]->(b)";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      res.redirect('/student');
    }
  });
});

function checkAuth(req, res, next) {
  if (!req.session.uId) {
    res.redirect('/')
  } else {
    next();
  }
}

module.exports = router;
