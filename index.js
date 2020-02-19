const Container = require('./lib/Container')

module.exports = function invoke(fn) {
  return new Container().get('invoke')(fn)
}

module.exports.async = fn => {
  return new Container().get('invoke').async(fn)
}
