const invoke = require('../lib/invoke')

it('can invoke a function', done => {
  invoke(() => done())
})

it('can provide a value', () => {
  let message

  invoke(({ provide, get }) => {
    provide('message', 'Hello world')
    message = get('message')
  })

  expect(message).toBe('Hello world')
})

it('can send a value to another function', () => {
  let user = null

  const getUserById = ({ data }) => id => {
    return data.users[id]
  }

  const addUser = ({ data }) => user => {
    data.users[user.id] = user
  }

  invoke(({ provide, invoke }) => {
    provide('data', { users: {} })

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
