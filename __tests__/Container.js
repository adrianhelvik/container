const mock = require('@adrianhelvik/mock')
const Container = require('../lib/Container')

let errors = []

process.on('unhandledRejection', error => {
  console.error(error.stack)
})

describe('Container', () => {
  describe('.constant(key, value)', () => {
    it('can store constant values', () => {
      const container = new Container()
      container.constant('message', 'Hello world')
      expect(container.dependencies.message).toBe('Hello world')
    })

    it('can shadow a dependency in the parent container', () => {
      const parent = new Container()
      const child = parent.extend()

      const inParent = 'In parent'
      const inChild = 'In child'

      parent.constant('dep', inParent)
      child.constant('dep', inChild)

      expect(parent.dependencies.dep).toBe(inParent)
      expect(child.dependencies.dep).toBe(inChild)
    })

    it('can shadow a provider in the parent container', () => {
      const parent = new Container()
      const child = parent.extend()

      const inParent = 'In parent'
      const inChild = 'In child'

      parent.provider('dep', () => inParent)
      child.constant('dep', inChild)

      expect(parent.dependencies.dep).toBe(inParent)
      expect(child.dependencies.dep).toBe(inChild)
    })

    it('throws an error if the value exists', () => {
      const container = new Container()
      container.constant('foo', 1)
      expect(() => container.constant('foo', 2)).toThrow(TypeError)
    })
  })

  describe('redefineConstant', () => {
    it('redefines the constant in the container', () => {
      const container = new Container()
      container.constant('foo', 1)
      expect(() => container.redefineConstant('foo', 2)).not.toThrow()
      expect(container.dependencies.foo).toBe(2)
    })

    it('throws an error if the container does not have the value', () => {
      const container = new Container()
      expect(() => container.redefineConstant('foo', 1)).toThrow(TypeError)
    })
  })

  describe('invoke(fn)', () => {
    it('calls functions', done => {
      const container = new Container()
      container.invoke(() => {
        done()
      })
    })

    it('calls functions synchronously', () => {
      const container = new Container()
      let called = false
      container.invoke(() => {
        called = true
      })
      expect(called).toBe(true)
    })

    it('provides the dependencies of the container', done => {
      const container = new Container()

      container.constant('foo', 'bar')

      container.invoke(dependencies => {
        try {
          expect(dependencies).toBeDefined()
          expect(dependencies.foo).toBe('bar')
          done()
        } catch (error) {
          done.fail(error)
        }
      })
    })

    it('can inject constant values', done => {
      const container = new Container()

      container.constant('message', 'Hello world')

      container.invoke(({ message }) => {
        expect(message).toBe('Hello world')
        done()
      })
    })

    it('can inject providers', done => {
      const container = new Container()

      container.provider('message', () => 'Hello world')

      container.invoke(({ message }) => {
        expect(message).toBe('Hello world')
        done()
      })
    })

    it('can can be awaited', async () => {
      const container = new Container()

      let called = false
      await container.invoke(() => {
        called = true
      })
      expect(called).toBe(true)
    })

    it('rethrows async errors', async () => {
      const container = new Container()

      try {
        await container.invoke(async () => {
          throw Error('Async error')
        })
      } catch (e) {
        var error = e.message
      }
      expect(error).toBe('Async error')
    })

    it('awaits async functions', async () => {
      const container = new Container()

      let called = false
      await container.invoke(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        called = true
      })
      expect(called).toBe(true)
    })

    it('throws an error on cyclic dependencies', () => {
      const container = new Container()

      container.provider('foo', ({ invoke }) => {
        return {
          bar: invoke(({ bar }) => bar),
        }
      })

      container.provider('bar', ({ invoke }) => {
        return {
          foo: invoke(({ foo }) => foo),
        }
      })

      expect(() => {
        container.get('foo')
      }).toThrow(/Encountered cyclic dependency/)
    })

    it('throws an error on cyclic dependencies', () => {
      const container = new Container()

      container.provider('foo', ({ bar }) => {
        return { bar }
      })

      container.provider('bar', ({ foo }) => {
        return { foo }
      })

      expect(() => {
        container.get('foo')
      }).toThrow(/Encountered cyclic dependency/)
    })

    it('handles async cyclic dependencies', async () => {
      const container = new Container()

      container.provider('foo', async ({ invoke }) => {
        await new Promise(resolve => setTimeout(resolve))
        const bar = await invoke(({ bar }) => bar)
        return { bar }
      })

      container.provider('bar', async ({ invoke }) => {
        await new Promise(resolve => setTimeout(resolve))
        const foo = await invoke(({ foo }) => foo)
        return { foo }
      })

      container.invoke(async ({ foo, bar }) => {
        foo = await foo
        bar = await bar
        expect(foo.bar).toBe(bar)
        expect(bar.foo).toBe(foo)
      })
    })
  })

  describe('.provider(key, provider)', () => {
    it('stores a provider in the container', () => {
      const container = new Container()

      container.provider('message', () => 'Hello world')
      expect(container.dependencies.message).toBe('Hello world')
    })

    it('is only invoked once', () => {
      const container = new Container()

      let callCount = 0

      container.provider('callCount', () => ++callCount)

      expect(container.dependencies.callCount).toBe(1)
      expect(container.dependencies.callCount).toBe(1)
      expect(container.dependencies.callCount).toBe(1)
      expect(container.dependencies.callCount).toBe(1)
    })

    it('defers calling the provider function until the dependency is needed', done => {
      const container = new Container()

      let called = false

      container.provider('pure', () => 'bar')
      container.provider('sideEffects', () => (called = true))

      container.invoke(({ pure }) => {
        expect(called).toBe(false)
        container.invoke(({ sideEffects }) => {
          expect(called).toBe(true)
          done()
        })
      })
    })

    it('can shadow a provider that exists in a parent', () => {
      const parent = new Container()
      const child = parent.extend()

      const inParent = 'In parent'
      const inChild = 'In child'

      parent.provider('dependency', () => inParent)
      child.provider('dependency', () => inChild)

      expect(parent.dependencies.dependency).toBe(inParent)
      expect(child.dependencies.dependency).toBe(inChild)
    })

    it('can shadow a constant in a parent', () => {
      const parent = new Container()
      const child = parent.extend()

      const inParent = 'In parent'
      const inChild = 'In child'

      parent.constant('dependency', inParent)
      child.provider('dependency', () => inChild)

      expect(parent.dependencies.dependency).toBe(inParent)
      expect(child.dependencies.dependency).toBe(inChild)
    })

    it('throws an error if redifining existing dependency', () => {
      const container = new Container()

      container.provider('foo', () => {})
      expect(() => {
        container.provider('foo', () => {})
      }).toThrow(TypeError)
    })
  })

  describe('redefineProvider(key, provider)', () => {
    it('redefines a provider', () => {
      const container = new Container()

      container.provider('foo', () => 1)
      expect(() => container.redefineProvider('foo', () => 2)).not.toThrow()
      expect(container.dependencies.foo).toBe(2)
    })

    it('throws an error if the container does not have the value', () => {
      const container = new Container()

      expect(() => container.redefineProvider('foo', () => 1)).toThrow(
        TypeError,
      )
    })
  })

  describe('reloadProvider(key)', () => {
    it('reloads a provider', () => {
      const container = new Container()

      const oldDb = mock()
      const newDb = mock()
      let counter = 0

      container.constant('db', oldDb)
      container.provider('myProvider', ({ db }) => {
        db(++counter)
      })

      container.dependencies.myProvider // eslint-disable-line
      container.redefineConstant('db', newDb)
      container.reloadProvider('myProvider')
      container.dependencies.myProvider // eslint-disable-line

      expect(oldDb.$args[0]).toEqual([1])
      expect(newDb.$args[0]).toEqual([2])
    })
  })

  describe('reloadAllProviders()', () => {
    test('it reloads a provider', () => {
      const container = new Container()

      const oldDb = mock()
      const newDb = mock()
      let counter = 0

      container.constant('db', oldDb)
      container.provider('myProvider', ({ db }) => {
        db(++counter)
      })

      container.dependencies.myProvider // eslint-disable-line
      container.redefineConstant('db', newDb)
      container.reloadAllProviders()
      container.dependencies.myProvider // eslint-disable-line

      expect(oldDb.$args[0]).toEqual([1])
      expect(newDb.$args[0]).toEqual([2])
    })
  })

  describe('.eagerProvider(key, value)', () => {
    it('stores a provider in the container', () => {
      const container = new Container()

      container.eagerProvider('foo', () => 'bar')
      expect(container.dependencies.foo).toBe('bar')
    })

    it('can provide constants as dependencies', done => {
      const container = new Container()

      container.eagerProvider('eager', deps => {
        expect(deps.message).toBe('Hello world')
        done()
      })
      container.constant('message', 'Hello world')
    })

    it('can provide providers as dependencies', done => {
      const container = new Container()

      container.eagerProvider('eager', ({ message }) => {
        expect(message).toBe('Hello world')
        done()
      })
      container.constant('message', 'Hello world')
    })
  })

  describe('.extend()', () => {
    it('returns a new Container instance', () => {
      const container = new Container()

      expect(container.extend() instanceof Container).toBe(true)
    })

    it('looks up values in the parent container', () => {
      const container = new Container()

      container.constant('foo', 'bar')
      const childContainer = container.extend()

      expect(childContainer.dependencies.foo).toBe('bar')
    })

    it('prefers values in the current container', () => {
      const container = new Container()

      container.constant('foo', 'bar')
      const childContainer = container.extend()
      childContainer.constant('foo', 'Hello world')

      expect(childContainer.dependencies.foo).toBe('Hello world')
    })

    it('does not overwrite values in the parent container', () => {
      const container = new Container()

      container.constant('foo', 'bar')
      const childContainer = container.extend()
      childContainer.constant('foo', 'Hello world')

      expect(container.dependencies.foo).toBe('bar')
    })
  })

  test('hasOwnProperty is not in the dependencies by default', () => {
    const container = new Container()

    expect(container.dependencies.hasOwnProperty).not.toBeDefined()
  })

  test('hasOwnProperty is not in the providers by default', () => {
    const container = new Container()

    expect(container.providers.hasOwnProperty).not.toBeDefined()
  })

  test('Object.keys returns keys for all values in the container', () => {
    const container = new Container()

    container.constant('a', null)
    container.provider('b', () => {})
    container.eagerProvider('c', () => {})

    expect(Object.keys(container.dependencies).sort()).toEqual(['a', 'b', 'c'])
  })

  describe('.providers', () => {
    test('you can access the providers (not the provider results) from the container', () => {
      const container = new Container()

      let count = 0
      container.provider('foo', () => ++count)

      container.dependencies.foo // eslint-disable-line
      container.dependencies.foo // eslint-disable-line
      container.dependencies.foo // eslint-disable-line

      const updatedCount = container.providers.foo()

      expect(count).toBe(2)
      expect(updatedCount).toBe(2)
    })

    test('you can access the providers (not the provider results) from a child container', () => {
      const container = new Container()

      let count = 0
      container.provider('foo', () => ++count)

      container.dependencies.foo // eslint-disable-line
      container.dependencies.foo // eslint-disable-line
      container.dependencies.foo // eslint-disable-line

      const childContainer = container.extend()

      const updatedCount = childContainer.providers.foo()

      expect(count).toBe(2)
      expect(updatedCount).toBe(2)
    })
  })

  it('can inject dependencies later to handle cyclic relations', async () => {
    const container = new Container()

    container.provider('foo', ({ invoke }) => {
      return {
        bar: () => invoke(({ bar }) => bar),
      }
    })

    container.provider('bar', ({ invoke }) => {
      return {
        foo: () => invoke(({ foo }) => foo),
      }
    })

    container.invoke(({ foo, bar }) => {
      expect(foo.bar()).toBe(bar)
      expect(bar.foo()).toBe(foo)
    })
  })

  describe('.keys()', () => {
    it('returns the keys in the current container', () => {
      const container = new Container()

      container.provider('foo', () => 42)
      const childContainer = container.extend()
      childContainer.provider('bar', () => 43)

      expect(childContainer.keys()).toEqual(['bar'])
    })
  })

  test('docs: Container.prototype.extend', () => {
    const container = new Container()
    container.provider('foo', () => 42)
    const childContainer = container.extend()
    childContainer.provider('bar', () => 43)

    childContainer.invoke(({ foo, bar }) => {
      expect(foo).toBe(42)
      expect(bar).toBe(43)
    })

    childContainer.provider('foo', () => 44)

    childContainer.invoke(({ foo }) => {
      expect(foo).toBe(44)
    })
  })

  describe('injected: constant(key, value)', () => {
    it('adds a value to the inner container', () => {
      const container = new Container()

      let value

      container.invoke(({ invoke, constant }) => {
        constant('message', 'Hello world')

        invoke(({ message }) => {
          value = message
        })
      })

      expect(value).toBe('Hello world')
    })

    it('does not pollute the parent container', () => {
      const container = new Container()

      let value

      container.invoke(({ invoke, constant }) => {
        constant('message', 'Hello world')
      })

      container.invoke(({ message }) => {
        value = message
      })

      expect(value).toBe(undefined)
    })

    it('can be called in an invoke within a provider', () => {
      const container = new Container()

      container.provider('okay', ({ invoke }) => {
        invoke(({ constant }) => {
          constant('foo', 'bar')
        })
      })

      expect(() => {
        container.get('okay')
      }).not.toThrow()
    })

    test('full example', () => {
      const container = new Container()

      let valueA
      let valueB

      container.provider('message', () => 'Foo bar')

      container.invoke(({ constant, invoke }) => {
        constant('message', 'Hello world')
        constant('foo', 'Hello world')

        invoke(({ message }) => {
          valueA = message
        })
      })

      container.invoke(({ message }) => {
        valueB = message
      })

      expect(valueA).toBe('Hello world')
      expect(valueB).toBe('Foo bar')
    })
  })

  describe('.get(key)', () => {
    it('gets provider values', () => {
      const container = new Container()
      container.provider('foo', () => 42)
      expect(container.get('foo')).toBe(42)
    })

    it('gets constant values', () => {
      const container = new Container()
      container.constant('foo', 42)
      expect(container.get('foo')).toBe(42)
    })
  })

  describe('.has(key)', () => {
    it('checks if provided values exist', () => {
      const container = new Container()
      container.provider('foo', () => undefined)
      expect(container.has('foo')).toBe(true)
    })

    it('does not call the provider', () => {
      const container = new Container()
      let called = false
      container.provider('foo', () => {
        called = true
      })
      container.has('foo')
      expect(called).toBe(false)
    })

    it('checks if constant values exist', () => {
      const container = new Container()
      container.constant('foo', 42)
      expect(container.has('foo')).toBe(true)
    })

    it('checks if parent containers have the value', () => {
      const container = new Container()
      const child = container.extend()
      container.constant('foo', 42)
      expect(child.has('foo')).toBe(true)
    })
  })

  describe('.hasOwn(key)', () => {
    it('checks if provided values exist', () => {
      const container = new Container()
      container.provider('foo', () => undefined)
      expect(container.hasOwn('foo')).toBe(true)
    })

    it('does not call the provider', () => {
      const container = new Container()
      let called = false
      container.provider('foo', () => {
        called = true
      })
      container.hasOwn('foo')
      expect(called).toBe(false)
    })

    it('checks if constant values exist', () => {
      const container = new Container()
      container.constant('foo', 42)
      expect(container.hasOwn('foo')).toBe(true)
    })

    it('does not check if parent containers have the value', () => {
      const container = new Container()
      const child = container.extend()
      container.constant('foo', 42)
      expect(child.hasOwn('foo')).toBe(false)
    })
  })

  it('throws a meaningful error if you have a cyclic dependency', () => {
    const container = new Container()
    // foo -> bar -> baz -> foo
    container.provider('foo', ({ bar }) => {})
    container.provider('bar', ({ baz }) => {})
    container.provider('baz', ({ foo }) => {})

    expect(() => container.get('foo')).toThrow(
      'Encountered cyclic dependency: foo -> bar -> baz -> foo',
    )
  })
})
