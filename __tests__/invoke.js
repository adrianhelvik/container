const invoke = require('..')

describe('invoke', () => {
  it('invokes a function synchronously', () => {
    let invoked = false
    invoke(() => (invoked = true))
    expect(invoked).toBe(true)
  })

  describe('injected: constant', () => {
    it('sets a value', () => {
      let message

      invoke(({ constant, get }) => {
        constant('message', 'Hello world')
        message = get('message')
      })

      expect(message).toBe('Hello world')
    })

    it('can not be redefined', () => {
      expect(() => {
        invoke(({ constant }) => {
          constant('foo', 'bar')
          constant('foo', 'baz')
        })
      }).toThrow('Cannot redefine property: foo')
    })

    it('returns the inserted value', () => {
      invoke(({ constant }) => {
        expect(constant('message', 'Hello world')).toBe('Hello world')
      })
    })
  })

  describe('injected: provider', () => {
    it('is evaluated lazily', () => {
      let ran = false

      invoke(({ provider, get }) => {
        provider('foo', () => (ran = true))
        expect(ran).toBe(false)
        get('foo')
        expect(ran).toBe(true)
      })
    })

    it('does not run twice', () => {
      let timesRan = 0

      invoke(({ provider, get }) => {
        provider('foo', () => {
          timesRan++
        })
        expect(timesRan).toBe(0)
        get('foo')
        expect(timesRan).toBe(1)
        get('foo')
        expect(timesRan).toBe(1)
      })
    })

    it('evaluates to the given value', () => {
      invoke(({ provider, get }) => {
        provider('foo', () => 'bar')

        expect(get('foo')).toBe('bar')
      })
    })
  })

  test('real use case', () => {
    let user = null

    const getUserById = ({ data }) => id => {
      return data.users[id]
    }

    const addUser = ({ data }) => user => {
      data.users[user.id] = user
    }

    invoke(({ constant, invoke }) => {
      constant('data', { users: {} })

      invoke(addUser)({
        id: 0,
        name: 'Peter Parker',
      })

      user = invoke(getUserById)(0)
    })

    expect(user).toEqual({
      id: 0,
      name: 'Peter Parker',
    })
  })

  describe('.async', () => {
    it('invokes the function', () => {
      return new Promise(resolve => {
        invoke.async(() => resolve())
      })
    })

    it('does not invoke the function immediately', async () => {
      let ran = false

      const promise = invoke.async(() => {
        ran = true
      })

      expect(ran).toBe(false)

      await promise

      expect(ran).toBe(true)
    })
  })
})
