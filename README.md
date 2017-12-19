# @adrianhelvik/container

[![Build Status](https://travis-ci.org/adrianhelvik/container.svg?branch=master)](https://travis-ci.org/adrianhelvik/container)
[![Coverage Status](https://coveralls.io/repos/github/adrianhelvik/container/badge.svg?branch=master)](https://coveralls.io/github/adrianhelvik/container?branch=master)

A non-hacky dependency container with lazily created dependencies.

# API

## Container.prototype.provider(name: string, provider: function)
Adds a new value to the container in the form of a provider function.
The provider is called with the dependencies in the container.

## Container.prototype.constant(name: string, value: any)
Adds a new value to the container in the form of a constant value.

## Container.prototype.invoke(fn: function)
Invoke the given function with the dependencies in the container.

```javascript
import Container from '@adrianhelvik/container'

const container = new Container()
container.provider('foo', () => {
  console.log('foo injected')
  return 10
})

// The dependency 'foo' is now injected into
// the function and the provider for foo is
// called.
container.invoke(({ foo }) => {
})
```
