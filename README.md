# @adrianhelvik/container

[![Build Status](https://travis-ci.org/adrianhelvik/container.svg?branch=master)](https://travis-ci.org/adrianhelvik/container)
[![Coverage Status](https://coveralls.io/repos/github/adrianhelvik/container/badge.svg?branch=master)](https://coveralls.io/github/adrianhelvik/container?branch=master)

## Usage

```javascript
import invoke from '@adrianhelvik/container'
import express from 'express'

invoke.async(async ({ invoke, constant, provider }) => {

  // We register some constants
  // in the current scope. This
  // will be available in the
  // current scope and any
  // child scopes.
  constant('app', express())
  constant('db', await setupDatabase())
  constant('getUsers', () => {
    throw Error('Access denied')
  })
  constant('respond', value => {
    throw Error('Called respond outside of a request')
  })

  invoke(routes)

  app.listen(5000)
})

// ... In the routes we can access `app`
// that was defined in the function above.
// This is because we called it using
// the invoke function.
const routes = ({ app, invoke }) => {
  app.get('/users/:id', (req, res) => {

    invoke(({ invoke, constant }) => {

      // It is also useful to provide some
      // constants for the route handler,
      // so we define them here.
      constant('respond', value => res.json(value))
      constant('id', req.params.id)

      if (canAccessUsers) {
        constant('getUsers', () => ({ id: 42, name: 'Happy user' }))
      }

      // We can now invoke getUsers. It
      // can access any of the constants
      // we have defined in an outer
      // scope.
      invoke(getUsers)
    })
  })
}

const getUsers = async ({ db, id, respond }) => {
  respond(await db.get('users', id))
}
```
