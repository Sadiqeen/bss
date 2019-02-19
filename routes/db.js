var db = require("seraph")({
  server: "http://192.168.99.100:7474",
  user: "neo4j",
  pass: "051737"
});
console.log('Connected');

module.exports = db;
