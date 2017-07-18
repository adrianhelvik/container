class Container {
  constructor(parent) {
    if (parent)
      this.dependencies = Object.create(parent.dependencies)
    else
      this.dependencies = Object.create(null)
    this.resolvedProviders = {}
  }

  constant(key, value) {
    this.dependencies[key] = value
  }

  provider(key, provider) {
    Object.defineProperty(this.dependencies, key, {
      get: () => {
        if (! this.resolvedProviders[key]) {
          this.resolvedProviders[key] = {
            value: provider(this.dependencies)
          }
        }
        return this.resolvedProviders[key].value
      }
    })
  }

  eagerProvider(key, provider) {
    this.provider(key, provider)
    setImmediate(() => this.dependencies[key])
  }

  invoke(fn) {
    setImmediate(() => fn(this.dependencies))
  }

  extend() {
    return new Container(this)
  }
}

module.exports = Container
