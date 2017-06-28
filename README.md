# MysqlQuery

## Install

> npm install benpptung/mysql-query -S

## Instroduction

This is a mysql module wrapper with some methods to simplify sql query.

## option

config to create mysql pool. 

- driver: `mysql` or `mysql2` to choose among the two modules.


> var db = new MysqlQuery(opt)


## properties

- mysql : mysql or mysql2, depends on the `option.driver`

- pool : the pool created by mysql. This is a `singleton` object, that said, if multiple `MysqlQuery` instances created, all of them will share the same pool. 

## methods

### this.query(method, sql, values, cb)

automatically release connection, and if any warning, it will query the warnings, and callback error with the warnings.

### this.insertId(method, sql, values, cb)

Same as `this.query()`, but it will return the `res.insertId` if insertId exists.

### this.objectSelect(method, sql, values, cb)

Same as `this.query()`, but it will return the `res[0]` as an object if exists.

### this.arraySelect(method, sql, values, cb)

Same as `this.query()`, but it will treat `res` as an array, and return this array.


## Example

inherits this object in the db api developement

```
const inherits = require('util').inherits;
const MysqlQuery = require('mysql-query');
const _proto = require('prototype');

inherits(User, MysqlQuery);
module.exports = User;
var prototype = Object.assign(User.prototype, _proto);


function User(opt) {
	MysqlQuery.call(this, opt);
}

/**
 * @public
 * @param {number}   uId
 * @param {function} cb
 */
prototype.find = function(uId, cb) {
  var sql = 'select * from User where uId = ?';
  this.objectSelect('find()', sql, [uId], cb);
}

```


