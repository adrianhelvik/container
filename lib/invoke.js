const Container = require('./Container.js')

module.exports = fn => {
  return new Container().invoke(fn)
}
