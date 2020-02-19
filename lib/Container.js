let lookingUp = null

class Container {
  constructor(parent) {
    this.resolvedProviders = {}
    this.stack = []
    this.stackMap = {}

    if (parent) {
      this.dependencies = Object.create(parent.dependencies)
      this.providers = Object.create(parent.providers)
    } else {
      this.dependencies = Object.create(null)
      this.providers = Object.create(null)
    }

    const invoke = this.invoke.bind(this)

    invoke.async = fn => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            resolve(invoke(fn))
          } catch (e) {
            reject(e)
          }
        })
      })
    }

    Object.defineProperty(this.dependencies, 'invoke', {
      value: invoke,
      enumerable: false,
      writable: false,
    })

    Object.defineProperty(this.dependencies, 'constant', {
      value: this.constant.bind(this),
      enumerable: false,
      writable: false,
    })

    Object.defineProperty(this.dependencies, 'provider', {
      value: this.provider.bind(this),
      enumerable: false,
      writable: false,
    })

    Object.defineProperty(this.dependencies, 'get', {
      value: this.get.bind(this),
      enumerable: false,
      writable: false,
    })
  }

  constant(key, value) {
    this.provider(key, () => value)
    return value
  }

  keys() {
    return Object.keys(this.dependencies)
  }

  provider(key, provider) {
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
