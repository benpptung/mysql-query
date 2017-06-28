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

  this.query = this.query.bind(this);
  this.insertId = this.insertId.bind(this);
  this.objectSelect = this.objectSelect.bind(this);
  this.arraySelect = this.arraySelect.bind(this);
}

/**
 * @protected
 * @param {string} method
 * @param {string} sql
 * @param {*} values
 * @param {function} cb
 */
prototype.query = function(method, sql, values, cb) {
  this.pool.getConnection(connect(method, sql, values, cb));
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

