const Container = require('../lib/Container')

describe('Container', () => {
  let container
  beforeEach(() => {
    container = new Container()
  })

  describe('.constant(key, value)', () => {
    it('can store constant values', () => {
      container.constant('message', 'Hello world')
      expect(container.dependencies.message).toBe('Hello world')
    })
  })

  describe('invoke(fn)', () => {
    it('calls functions', (done) => {
      container.invoke(() => {
        done()
      })
    })

    it('calls functions asynchronously', () => {
      let called = false
      container.invoke(() => {
        called = true
      })
      expect(called).toBe(false)
    })

    it('provides the dependencies of the container', (done) => {
      container.invoke(dependencies => {
        try {
          expect(dependencies).toBeDefined()
          expect(dependencies).toBe(container.dependencies)
          done()
        } catch (error) {
          done.fail(error)
        }
      })
    })

    it('can inject constant values', (done) => {
      container.constant('message', 'Hello world')

      container.invoke(({ message }) => {
        expect(message).toBe('Hello world')
        done()
      })
    })

    it('can inject providers', (done) => {
      container.provider('message', () => 'Hello world')

      container.invoke(({ message }) => {
        expect(message).toBe('Hello world')
        done()
      })
    })

    it('can can be awaited', async () => {
      let called = false
      await container.invoke(() => {
        called = true
      })
      expect(called).toBe(true)
    })

    it('awaits async functions', async () => {
      let called = false
      await container.invoke(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        called = true
      })
      expect(called).toBe(true)
    })
  })

  describe('.provider(key, provider)', () => {
    it('stores a provider in the container', () => {
      container.provider('message', () => 'Hello world')
      expect(container.dependencies.message).toBe('Hello world')
    })

    it('is only invoked once', () => {
      let callCount = 0

      container.provider('callCount', () => ++callCount)

      expect(container.dependencies.callCount).toBe(1)
      expect(container.dependencies.callCount).toBe(1)
      expect(container.dependencies.callCount).toBe(1)
      expect(container.dependencies.callCount).toBe(1)
    })

    it('defers calling the provider function until the dependency is needed', (done) => {
      let called = false

      container.provider('pure', () => 'bar')
      container.provider('sideEffects', () => called = true)

      container.invoke(({ pure }) => {
        expect(called).toBe(false)
        container.invoke(({ sideEffects }) => {
          expect(called).toBe(true)
          done()
        })
      })
    })
  })

  describe('.eagerProvider(key, value)', () => {
    it('stores a provider in the container', () => {
      container.eagerProvider('foo', () => 'bar')
      expect(container.dependencies.foo).toBe('bar')
    })

    it('can provide constants as dependencies', (done) => {
      container.eagerProvider('eager', ({ message }) => {
        expect(message).toBe('Hello world')
        done()
      })
      container.constant('message', 'Hello world')
    })

    it('can provide providers as dependencies', (done) => {
      container.eagerProvider('eager', ({ message }) => {
        expect(message).toBe('Hello world')
        done()
      })
      container.constant('message', 'Hello world')
    })
  })

  describe('.extend()', () => {
    it('returns a new Container instance', () => {
      expect(container.extend() instanceof Container).toBe(true)
    })

    it('looks up values in the parent container', () => {
      container.constant('foo', 'bar')
      const childContainer = container.extend()

      expect(childContainer.dependencies.foo).toBe('bar')
    })

    it('prefers values in the current container', () => {
      container.constant('foo', 'bar')
      const childContainer = container.extend()
      childContainer.constant('foo', 'Hello world')

      expect(childContainer.dependencies.foo).toBe('Hello world')
    })

    it('does not overwrite values in the parent container', () => {
      container.constant('foo', 'bar')
      const childContainer = container.extend()
      childContainer.constant('foo', 'Hello world')

      expect(container.dependencies.foo).toBe('bar')
    })
  })

  test('hasOwnProperty is not in the dependencies by default', () => {
    expect(container.dependencies.hasOwnProperty).not.toBeDefined()
  })

  test('Object.keys returns keys for all values in the container', () => {
    container.constant('a', null)
    container.provider('b', () => {})
    container.eagerProvider('c', () => {})

    expect(Object.keys(container.dependencies).sort()).toEqual(['a', 'b', 'c'])
  })
})
