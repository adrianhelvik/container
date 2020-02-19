let lookingUp = null

class Container {
  constructor(parent) {
    this.preventProviding = () => false
    this.resolvedProviders = {}
    this.stack = []
    this.stackMap = {}

    if (parent) {
      this.dependencies = Object.create(parent.dependencies)
      this.preventProviding = parent.preventProviding
      this.providers = Object.create(parent.providers)
    } else {
      this.dependencies = Object.create(null)
      this.providers = Object.create(null)
    }

    Object.defineProperty(this.dependencies, 'invoke', {
      value: this.invoke.bind(this),
      enumerable: false,
      writable: false,
    })

    Object.defineProperty(this.dependencies, 'provide', {
      value: this._provide.bind(this),
      enumerable: false,
      writable: false,
    })

    Object.defineProperty(this.dependencies, 'get', {
      value: this.get.bind(this),
      enumerable: false,
      writable: false,
    })
  }

  _provide(key, value) {
    if (this.preventProviding()) {
      throw Error('Illegal call to injected provide(key, value)')
    }
    this.constant(key, value)
  }

  constant(key, value) {
    const preventProviding = this.preventProviding
    this.provider(key, () => value)
    this.preventProviding = preventProviding
  }

  keys() {
    return Object.keys(this.dependencies)
  }

  provider(key, provider) {
    this.preventProviding = () => true
    this.providers[key] = provider

    Object.defineProperty(this.dependencies, key, {
      get: () => {
        if (!this.resolvedProviders[key]) {
          this.stack.push(key)
          if (this.stackMap[key]) {
            throw Error(
              `Encountered cyclic dependency: ${this.stack.join(' -> ')}`,
            )
          }
          this.stackMap[key] = true
          try {
            this.resolvedProviders[key] = {
              value: this.providers[key](this.dependencies),
            }
          } finally {
            this.stack.pop()
            this.stackMap[key] = false
          }
        }
        return this.resolvedProviders[key].value
      },
      enumerable: true,
    })
  }

  redefineProvider(key, provider) {
    delete this.resolvedProviders[key]
    if (!this.providers[key])
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
    const container = new Container(this)
    container.preventProviding = () => false
    return fn(container.dependencies)
  }

  extend() {
    return new Container(this)
  }

  get(key) {
    return this.dependencies[key]
  }

  has(key) {
    return key in this.dependencies
  }

  hasOwn(key) {
    return Object.prototype.hasOwnProperty.call(this.dependencies, key)
  }
}

module.exports = Container
