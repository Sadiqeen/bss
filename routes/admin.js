var express = require('express');
var router = express.Router();
var db = require('./db');
var passwordHash = require('password-hash');
let date = require('date-and-time');
/* GET home page. */
router.get('/', checkAuth, function(req, res, next) {
  var cypherQuery = "MATCH (b:bic)<-[:type_of]-(t:type) RETURN b { .bId, .color, .status, type : (t { .name})}";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      res.render('admin/req', { title : 'ยืมจักรยาน', name : req.session.name , department : req.session.dpt , data : results });
    }
  });
});

router.post('/br', checkAuth, function(req, res, next) {
  var bId = req.body.bId;
  var uId = req.body.uId;
  var br = date.format(new Date(), 'DD/MM/YYYY');
  var re = date.format(date.addDays(new Date(), 7), 'DD/MM/YYYY');
  var cypherQuery = "MATCH p = (u:user {user_id:'" + uId + "'})-[r:borrow {status:'1'}]->() RETURN p";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      if (Object.keys(results).length > 0) {
        req.flash('error', '  ปรากฏสถานะการยืมในระบบ กรุณาทำการคืนก่อนการยืมครั้งต่อไป')
        res.redirect('/admin');
      } else {
        cypherQuery = "MATCH (u:user {user_id:'" + uId + "'}) RETURN u";
        db.query(cypherQuery, function(err, results) {
          if (err) {
            console.error('Error saving new node to database:', err);
          } else {
            if (Object.keys(results).length > 0 && results[0].status != 0) {
              var cypherQuery = "MATCH (u:user {user_id:'" + uId + "'}),(b:bic {bId:'" + bId + "'}) CREATE (u)-[:borrow {br_date:'" + br + "',re_date:'" + re + "',status:'1'}]->(b) SET b.status = '1'";
              db.query(cypherQuery, function(err, results) {
                if (err) {
                  console.error('Error saving new node to database:', err);
                } else {
                  req.flash('success', '  รหัสนักศึกษา ' + uId + ' ได้ยืมจักรยานหมายเลข ' + bId);
                  res.redirect('/admin');
                }
              });
            } else {
              req.flash('error', '  รหัสนักศึกษา ' + uId + ' ไม่มีอยู่ในระบบ หรือ ถูกปิดกั้นจากระบบ');
              res.redirect('/admin');
            }
          }
        });
      }
    }
  });
});

router.get('/brList', checkAuth, function(req, res, next) {
  var cypherQuery = "MATCH (u:user)-[r:borrow {status:'1'}]->(b:bic) RETURN u {.user_id, .fname, .lname, .position, r: (r {.br_date, .re_date, .status}),b: (b {.bId})}";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      var br;
      var re;
      var to = new Date();
      for (var i = 0; i < Object.keys(results).length; i++) {
        br = date.parse(results[i].r.br_date, 'DD/MM/YYYY');
        re = date.parse(results[i].r.re_date, 'DD/MM/YYYY');
        if (to < re) {
          if (to >= date.addDays(re, -2)) {
            // ใกล้กำหนดคืน
            results[i].r.status = "2";
          } else {
            // รอเวลาคืน
            results[i].r.status = "1";
          }
        } else if (to == re) {
          // ถึงกำหนดคืน
          results[i].r.status = "3";
        } else {
          // เลยกำหนด
          results[i].r.status = "4";
        }
      }
      res.render('admin/brList', { title : 'รายการยืม', name : req.session.name , department : req.session.dpt , data : results });
    }
  });
});

router.get('/re/:bId/:uId', checkAuth, function(req, res, next) {
  var bId = req.params.bId;
  var uId = req.params.uId;
  var to = date.format(new Date(), 'DD/MM/YYYY');
  var cypherQuery = "MATCH (b:bic {bId:'" + bId + "'})<-[r:borrow {status :'1'}]-(u:user {user_id:'" + uId + "'}) SET b.status = '0', r.status = '2' , r.re_date = '" + to + "'";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      console.log(results);
      res.redirect('/admin/brList');
    }
  });
});


router.get('/mngBic/:id?', checkAuth, function(req, res, next) {
  var cypherQuery = "MATCH (b:bic)<-[:type_of]-(t:type) RETURN b { .bId, .color, .status, type : (t { .name})}";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      res.render('admin/mngBic', { title : 'จัดการจักรยาน', name : req.session.name , department : req.session.dpt , data : results });
    }
  });
});

router.post('/mngBic/edit', checkAuth, function(req, res, next) {
  var bId = req.body.bId;
  var color = req.body.color;
  var type = req.body.type;
  var cypherQuery = "MATCH (b:bic {bId:'" + bId + "'})<-[r:type_of]-(:type),(t:type {name:'" + type + "'}) SET b.color = '" + color + "' DELETE r CREATE (b)<-[:type_of]-(t)";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      req.flash('success', '  จักรยานหมายเลข ' + bId + ' ได้อัพเดทข้อมูลแล้ว');
      res.redirect('/admin/mngBic');
    }
  });
});

router.post('/mngBic/add', checkAuth, function(req, res, next) {
  var bId = req.body.bIdadd;
  var color = req.body.coloradd;
  var type = req.body.typeadd;
  var cypherQuery = "MATCH (b:bic {bId:'" + bId + "'}) RETURN b";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      if (Object.keys(results).length > 0) {
        req.flash('error', '  จักรยานหมายเลข ' + bId + ' มีอยู่ในระบบ');
        res.redirect('/admin/mngBic');
      } else {
        cypherQuery = "MATCH (t:type {name:'" + type + "'}) CREATE (b:bic {bId : '" + bId + "', color : '" + color + "', status:'0'})<-[:type_of]-(t)";
        db.query(cypherQuery, function(err, results) {
          if (err) {
            console.error('Error saving new node to database:', err);
          } else {
            req.flash('success', '  จักรยานหมายเลข ' + bId + ' ถูกเพิ่มเข้าระบบ');
            res.redirect('/admin/mngBic');
          }
        });
      }
    }
  });
});

router.post('/mngBic/del', checkAuth, function(req, res, next) {
  var bId = req.body.bIdDel;
  var cypherQuery = "MATCH (b:bic {bId:'" + bId + "'})<-[r:borrow {status:'1'}]-(:user) RETURN r";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      if (Object.keys(results).length > 0) {
        req.flash('error', '  จักรยานหมายเลข ' + bId + ' อยู่ในระหว่างการยืม กรุณาทำรายการคืนก่อนลบข้อมูล');
        res.redirect('/admin/mngBic');
      } else {
        cypherQuery = "MATCH (:type)-[t:type_of]->(b:bic {bId:'" + bId + "'})<-[r:borrow]-(:user) DELETE b,r,t"
        db.query(cypherQuery, function(err, results) {
          if (err) {
            console.error('Error saving new node to database:', err);
          } else {
            req.flash('success', '  จักรยานหมายเลข ' + bId + ' ถูกลบออกจากระบบ');
            res.redirect('/admin/mngBic');
          }
        });
      }
    }
  });
});

router.get('/mngUser/:id?', checkAuth, function(req, res, next) {
  var cypherQuery = "MATCH (u:user {position:2}) RETURN u";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      res.render('admin/mngUser', { title : 'จัดการผู้ใช้', name : req.session.name , department : req.session.dpt , data : results});
    }
  });
});

router.post('/mngUser/edit', checkAuth, function(req, res, next) {
  var uIdMngUser = req.body.uIdMngUser;
  var fnameMngUser = req.body.fnameMngUser;
  var lnameMngUser = req.body.lnameMngUser;
  var phonMngUser = req.body.phonMngUser;
  var emailMngUser = req.body.emailMngUser;
  var departmentMngUser = req.body.departmentMngUser;
  var statusMngUser = req.body.statusMngUser;
  var cypherQuery = "MATCH (u:user {user_id:'" + uIdMngUser + "'})" +
                    " SET u.fname = '" + fnameMngUser +
                    "', u.lname='" + lnameMngUser +
                    "', u.phone='" + phonMngUser +
                    "', u.email='" + emailMngUser +
                    "', u.department='" + departmentMngUser +
                    "', u.status='" + statusMngUser +
                    "' ";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      req.flash('success', '  อัพเดทข้อมูลสำหรับรหัสนักศึกษา ' + uIdMngUser + ' เรียบร้อยแล้ว');
      res.redirect('/admin/mngUser');
    }
  });
});

router.post('/mngUser/del', checkAuth, function(req, res, next) {
  var uIdDelMngUser = req.body.uIdDelMngUser;
  var cypherQuery = "MATCH (u:user {user_id:'" + uIdDelMngUser + "'})-[:borrow {status:'1'}]->(:bic) RETURN u";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      if (Object.keys(results).length > 0) {
        req.flash('error', '  รหัสนักศึกษา ' + uIdDelMngUser + ' อยู่ในระหว่างการยืม กรุณาทำรายการคืนก่อนลบข้อมูล');
        res.redirect('/admin/mngUser');
      } else {
        cypherQuery = "MATCH P=(:user {user_id:'" + uIdDelMngUser + "'})-[:borrow]->() return P";
        db.query(cypherQuery, function(err, results) {
          if (err) {
            console.error('Error saving new node to database:', err);
          } else {
            if (Object.keys(results).length > 0) {
              cypherQuery = "MATCH (u:user {user_id:'" + uIdDelMngUser + "'})-[r:borrow]->() DELETE u,r";
            } else {
              cypherQuery = "MATCH (u:user {user_id:'" + uIdDelMngUser + "'}) DELETE u"
            }
            db.query(cypherQuery, function(err, results) {
              if (err) {
                console.error('Error saving new node to database:', err);
              } else {
                req.flash('success', '  ลบข้อมูลรหัสนักศึกษา ' + uIdDelMngUser + ' ออกจากระบบเรียบร้อยแล้ว');
                res.redirect('/admin/mngUser');
              }
            });
          }
        });
      }
    }
  });
});

router.post('/mngUser/add', checkAuth, function(req, res, next) {
  var uIdMngUserAdd = req.body.uIdMngUserAdd;
  var fnameMngUserAdd = req.body.fnameMngUserAdd;
  var lnameMngUserAdd = req.body.lnameMngUserAdd;
  var phonMngUserAdd = req.body.phonMngUserAdd;
  var emailMngUserAdd = req.body.emailMngUserAdd;
  var departmentMngUserAdd = req.body.departmentMngUserAdd;
  var statusMngUserAdd = req.body.statusMngUserAdd;
  var cypherQuery = "MATCH (u:user {user_id:'" + uIdMngUserAdd + "'}) RETURN u";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      if (Object.keys(results).length > 0) {
        req.flash('error', '  รหัสนักศึกษา ' + uIdMngUserAdd + ' มีอยู่ในระบบ');
        res.redirect('/admin/mngUser');
      } else {
        cypherQuery = "CREATE (u:user { " +
                        "user_id:'"+ uIdMngUserAdd +
                        "', fname:'" + fnameMngUserAdd +
                        "', lname: '" + lnameMngUserAdd +
                        "', phone:'" + phonMngUserAdd +
                        "', email:'" + emailMngUserAdd +
                        "', department:'" + departmentMngUserAdd +
                        "', position:2, " +
                        "status: " + statusMngUserAdd +
                        "})";
        db.query(cypherQuery, function(err, results) {
          if (err) {
            console.error('Error saving new node to database:', err);
          } else {
            req.flash('success', '  รหัสนักศึกษา ' + uIdMngUserAdd + ' ถูกเพิ่มเข้าระบบ');
            res.redirect('/admin/mngUser');
          }
        });
      }
    }
  });
});

router.get('/mngAdmin', checkAuth, function(req, res, next) {
  var cypherQuery = "MATCH (u:user {position:1}) RETURN u";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      res.render('admin/mngAdmin', { title : 'จัดการผู้ดูแลระบบ', name : req.session.name , department : req.session.dpt , data : results});
    }
  });
});

router.post('/mngAdmin/add', checkAuth, function(req, res, next) {
  var uIdMngUserAdd = req.body.uIdMngUserAdd;
  var fnameMngUserAdd = req.body.fnameMngUserAdd;
  var lnameMngUserAdd = req.body.lnameMngUserAdd;
  var phonMngUserAdd = req.body.phonMngUserAdd;
  var emailMngUserAdd = req.body.emailMngUserAdd;
  var departmentMngUserAdd = req.body.departmentMngUserAdd;
  var password = passwordHash.generate(uIdMngUserAdd + '1234');
  var statusMngUserAdd = req.body.statusMngUserAdd;

  var cypherQuery = "MATCH (u:user {user_id:'" + uIdMngUserAdd + "'}) RETURN u";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      if (Object.keys(results).length > 0) {
        req.flash('error', '  ไอดี ' + uIdMngUserAdd + ' มีอยู่ในระบบ');
        res.redirect('/admin/mngAdmin');
      } else {
        cypherQuery = "CREATE (u:user { " +
                        "user_id:'"+ uIdMngUserAdd +
                        "', fname:'" + fnameMngUserAdd +
                        "', lname: '" + lnameMngUserAdd +
                        "', pass: '" + password +
                        "', phone:'" + phonMngUserAdd +
                        "', email:'" + emailMngUserAdd +
                        "', department:'" + departmentMngUserAdd +
                        "', position:1, " +
                        "status: " + statusMngUserAdd +
                        "})";
        db.query(cypherQuery, function(err, results) {
          if (err) {
            console.error('Error saving new node to database:', err);
          } else {
            req.flash('success', '  ไอดี ' + uIdMngUserAdd + ' ถูกเพิ่มเข้าระบบ');
            res.redirect('/admin/mngAdmin');
          }
        });
      }
    }
  });
});

router.post('/mngAdmin/edit', checkAuth, function(req, res, next) {
  var uIdMngUser = req.body.uIdMngUser;
  var fnameMngUser = req.body.fnameMngUser;
  var lnameMngUser = req.body.lnameMngUser;
  var phonMngUser = req.body.phonMngUser;
  var emailMngUser = req.body.emailMngUser;
  var departmentMngUser = req.body.departmentMngUser;
  var statusMngUser = req.body.statusMngUser;
  var command = req.body.command;
  var cypherQuery = "MATCH (u:user {user_id:'" + uIdMngUser + "'})" +
                    " SET u.fname = '" + fnameMngUser +
                    "', u.lname='" + lnameMngUser +
                    "', u.phone='" + phonMngUser +
                    "', u.email='" + emailMngUser +
                    "', u.department='" + departmentMngUser +
                    "', u.status='" + statusMngUser +
                    "' ";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      console.log(command);
      
      if (command == "1") {
        req.flash('success', '  อัพเดทข้อมูลสำหรับไอดี ' + uIdMngUser + ' เรียบร้อยแล้ว');
        res.redirect('/admin/mngAdmin');
      } else {
        req.flash('success', '  อัพเดทข้อมูลเรียบร้อยแล้ว');
        res.redirect('/admin/profile');
      }    
    }
  });
});

router.post('/mngAdmin/del', checkAuth, function(req, res, next) {
  var uIdDelMngUser = req.body.uIdDelMngUser;
  var cypherQuery = "MATCH (u:user {user_id:'" + uIdDelMngUser + "'})-[:borrow {status:'1'}]->(:bic) RETURN u";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      if (Object.keys(results).length > 0) {
        req.flash('error', '  ไอดี ' + uIdDelMngUser + ' อยู่ในระหว่างการยืม กรุณาทำรายการคืนก่อนลบข้อมูล');
        res.redirect('/admin/mngAdmin');
      } else {
        cypherQuery = "MATCH (u:user {position:1}) RETURN u";
        db.query(cypherQuery, function(err, results) {
          if (err) {
            console.error('Error saving new node to database:', err);
          } else {
            if (Object.keys(results).length < 2) {
              req.flash('error', '  ไม่สามารถลบไอดีผู้ดูแลคนสุดท้ายได้');
              res.redirect('/admin/mngAdmin');
            } else {
              cypherQuery = "MATCH P=(:user {user_id:'" + uIdDelMngUser + "'})-[:borrow]->() return P";
              db.query(cypherQuery, function(err, results) {
                if (err) {
                  console.error('Error saving new node to database:', err);
                } else {
                  if (Object.keys(results).length > 0) {
                    cypherQuery = "MATCH (u:user {user_id:'" + uIdDelMngUser + "'})-[r:borrow]->() DELETE u,r";
                  } else {
                    cypherQuery = "MATCH (u:user {user_id:'" + uIdDelMngUser + "'}) DELETE u"
                  }
                  db.query(cypherQuery, function(err, results) {
                    if (err) {
                      console.error('Error saving new node to database:', err);
                    } else {
                      req.flash('success', '  ลบข้อมูลไอดี ' + uIdDelMngUser + ' ออกจากระบบเรียบร้อยแล้ว');
                      res.redirect('/admin/mngAdmin');
                    }
                  });
                }
              });
            }
          }
        });
      }
    }
  });
});

router.get('/history', checkAuth, function(req, res, next) {
  var cypherQuery = "MATCH (u)-[r:borrow {status:'2'}]->(b) RETURN u {.user_id, .position, borrow :(r {.br_date, .re_date, .status}), bic :(b {.bId})}";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      var br;
      var re;
      var brr;
      for (var i = 0; i < Object.keys(results).length; i++) {
        br = date.parse(results[i].borrow.br_date, 'DD/MM/YYYY');
        brr = date.addDays(br, +7);
        re = date.parse(results[i].borrow.re_date, 'DD/MM/YYYY');
        if (re <= brr) {
          results[i].borrow.status = "1";
        } else {
          // เลยกำหนด
          results[i].borrow.status = "0";
        }
      }
      res.render('admin/history', { title : 'ประวัติการยืมจักรยาน', name : req.session.name , department : req.session.dpt , data : results });
    }
  });
});

router.get('/profile' , checkAuth, function (req, res, next) {
  var cypherQuery = "MATCH (u:user {user_id:'" + req.session.uId + "'}) RETURN u";
  db.query(cypherQuery, function(err, results) {
    if (err) {
      console.error('Error saving new node to database:', err);
    } else {
      res.render('admin/profile', { title : 'แก้ไขข้อมูลส่วนตัว', name : req.session.name , department : req.session.dpt, data : results[0]})
    }
  });
});

router.post('/profile/pass', checkAuth, function(req, res, next){
  var p1 = req.body.p1;
  var p2 = req.body.p2;
  var pass = passwordHash.generate(req.session.uId + p1);
  if (p1 == p2) {
    var cypherQuery = "MATCH (u:user {user_id:'" + req.session.uId + "'}) SET u.pass = '" + pass + "'";
    db.query(cypherQuery, function(err, results) {
      if (err) {
        console.error('Error saving new node to database:', err);
      } else {
        req.flash('success', '  เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        res.redirect('/admin/profile');
      }
    });
  } else {
    req.flash('error', '  รหัสผ่านไม่ตรงกัน');
    res.redirect('/admin/profile');
  }
});

function checkAuth(req, res, next) {
  if (!req.session.uId) {
    res.redirect('/');
  } else {
    next();
  }
}

module.exports = router;
