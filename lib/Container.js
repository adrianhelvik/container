class Container {
  constructor(parent) {
    if (parent) {
      this.dependencies = Object.create(parent.dependencies)
      this.providers = Object.create(parent.providers)
    } else {
      this.dependencies = Object.create(null)
      this.providers = Object.create(null)
    }
    this.resolvedProviders = {}

    Object.defineProperty(this.dependencies, 'invoke', {
      value: this.invoke.bind(this),
      enumerable: false,
      writable: false
    })
  }

  constant(key, value) {
    this.provider(key, () => value)
  }

  keys() {
    return Object.keys(this.dependencies)
  }

  provider(key, provider) {
    this.providers[key] = provider

    Object.defineProperty(this.dependencies, key, {
      get: () => {
        if (! this.resolvedProviders[key]) {
          this.resolvedProviders[key] = { value: null }
          this.resolvedProviders[key] = {
            value: this.providers[key](this.dependencies)
          }
        }
        return this.resolvedProviders[key].value
      },
      enumerable: true
    })
  }

  redefineProvider(key, provider) {
    delete this.resolvedProviders[key]
    if (! this.providers[key])
      throw TypeError(`Cannot redefine non-existant provider "${key}"`)
    this.providers[key] = provider
  }

  reloadProvider(key) {
    delete this.resolvedProviders[key]
  }

  reloadAllProviders() {
    this.resolvedProviders = []
  }

  redefineConstant(key, constant) {
    this.redefineProvider(key, () => constant)
  }

  eagerProvider(key, provider) {
    this.provider(key, provider)
    setImmediate(() => this.dependencies[key])
  }

  invoke(fn) {
    return fn(this.dependencies)
  }

  extend() {
    return new Container(this)
  }
}

module.exports = Container
