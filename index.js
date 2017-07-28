'use strict';

const mysql = require('mysql');
const mysql2 = require('mysql2');
const connect = require('./lib/connect');

module.exports = MysqlQuery;
var prototype = MysqlQuery.prototype;
var pool = null;

/**
 * @param {object} opt
 * @return {MysqlQuery}
 * @constructor
 */
function MysqlQuery(opt) {
  if (!(this instanceof MysqlQuery)) return new MysqlQuery(opt);

  var driver = ~['mysql', 'mysql2'].indexOf(opt.driver) ? opt.driver : 'mysql';
  delete opt.driver;

  // pool shall be singleton
  if (!pool) pool = mysql.createPool(opt);

  Object.defineProperties(this, {

    /**
     * @property mysql
     */
    mysql: { get: _=> driver === 'mysql' ? mysql : mysql2 },

    /**
     * @property pool
     */
    pool: { get: _=> pool }
  });
}

/**
 * query(): do not return anything except error
 * @protected
 * @param {string} method
 * @param {string} sql
 * @param {*} values
 * @param {function} cb
 */
prototype.query = function(method, sql, values, cb) {
  //this.pool.getConnection(connect(method, sql, values, cb));
  // query(): do not return anything except error
  this.pool.getConnection(connect(method, sql, values, err=> cb(err)));
};

/**
 * @protected
 * @param {string} method
 * @param {string} sql
 * @param {*} values
 * @param {function} cb
 */
prototype.insertId = function(method, sql, values, cb) {
  this.pool.getConnection(connect(method, sql, values, function(err, res) {
    if (err) return cb(err);
    if (res && res.insertId) return cb(null, res.insertId);
    cb(null, null);
  }))
};

/**
 * @protected
 * @param {string} method
 * @param {string} sql
 * @param {*} values
 * @param {function} cb
 */
prototype.objectSelect = function(method, sql, values, cb) {
  this.pool.getConnection(connect(method, sql, values, function(err, res) {
    if (err) return cb(err);
    if (!res[0]) return cb(null, null);
    cb(null, Object.assign({}, res[0]));
  }));
};

/**
 * @protected
 * @param {string} method
 * @param {string} sql
 * @param {*} values
 * @param {function} cb
 */
prototype.arraySelect = function(method, sql, values, cb) {
  this.pool.getConnection(connect(method, sql, values, function(err, res) {
    if (err) return cb(err);
    cb(null, res.map(raw_data_packet=> Object.assign({}, raw_data_packet)));
  }));
};

/**
 * Return a payload with attributes limited to whitelist
 * @param payload
 * @param attributes
 * @return {{}}
 */
MysqlQuery.whitelist = function(payload, attributes) {
  var state = {};
  if (!Array.isArray(attributes) || !attributes.length) return state;

  var keys = Object.keys(payload);
  for(let i = 0, len = keys.length; i < len; ++i) {
    let key = keys[i];
    if (attributes.indexOf(key) >= 0) state[key] = payload[key];
  }

  return state;
};