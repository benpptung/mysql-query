'use strict';

const debug = require('debug')('mysql-query');

/**
 * Wrap complicated async process in sql query into single async call
 * @param {string} method
 * @param {string} sql
 * @param {*} values
 * @param {Function} callback
 * @return {Function}
 */
module.exports = function connect(method, sql, values, callback) {

  // values might be function, in that case, the functin might be callback inserted by util-asyncflow
  // so, we do not auto-switch option to avoid wierd bug

  return function(err, conn) {

    if (err) {
      err.original = {message: 'getConnection() error', method};
      return callback(err);
    }

    var query = conn.query(sql, values, function(err, res, fields) {

      debug(serialQuery(query));

      if (res && (res.warningCount || res.warningStatus)) {

        // check what error happened via show warnings
        conn.query('show warnings', function(err, res) {

          conn.release();

          // show warnings but got error
          if (err) {
            err.original = errOriginal(method + ': has warnings but got error in show warnings', query);
            return callback(err);
          }

          err = new Error(method +': show warnings');
          err.original = Object.assign({ warnings:res }, errOriginal(method, query));
          return callback(err);
        });

        return;
      }

      conn.release();

      if (err) {
        err.original = errOriginal(method, query);
        return callback(err);
      }

      callback(null, res, fields);
    })

  }
};



function errOriginal(message, query) {
  return Object.assign({message}, serialQuery(query));
}

function serialQuery(query) {
  if (query !== Object(query)) return {};
  return {
    sql: query.sql,
    values: query.values
  }
}