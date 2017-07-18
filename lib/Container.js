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
  }

  constant(key, value) {
    this.dependencies[key] = value
  }

  provider(key, provider) {
    this.providers[key] = provider

    Object.defineProperty(this.dependencies, key, {
      get: () => {
        if (! this.resolvedProviders[key]) {
          this.resolvedProviders[key] = {
            value: provider(this.dependencies)
          }
        }
        return this.resolvedProviders[key].value
      },
      enumerable: true
    })
  }

  eagerProvider(key, provider) {
    this.provider(key, provider)
    setImmediate(() => this.dependencies[key])
  }

  invoke(fn) {
    return new Promise((resolve, reject) => {
      setImmediate(async () => {
        try {
          resolve(await fn(this.dependencies))
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  extend() {
    return new Container(this)
  }
}

module.exports = Container
