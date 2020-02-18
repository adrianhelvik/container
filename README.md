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
This method creates a new container, so that we can use the
provide method as well.

```javascript
const container = new Container()
container.provider('message', ({ who }) => 'Hello ' + who)
container.constant('who', 'world')

container.invoke(({ message }) => {
  console.log(message) // logs 'Hello world'
})
```

## Injected: invoke
The invoke function is injected. It allows you to invoke another
function with the dependencies of the container as the first
parameter. A new child container is created to allow providing
scoped dependencies.

## Injected: provide
This method lets you provide a dependency into the container.
It calls `.constant(k, v)` on the current container.

```javascript
container.invoke(({ invoke, provide }) => {
  provide('message', 'Hello on the outside')

  invoke(({ invoke, provide }) => {
    provide('message', 'Hello on the inside')

    invoke(({ message }) => {
      console.log(message) // Hello on the inside
    })
  })

  invoke(({ message }) => {
    console.log(message) // Hello on the outside
  })
})
```

## Container.prototype.extend()
Create a container that extends from the current one.
Dependencies from the child container are preferred.
The child container will lookup dependencies in the
parent container if no matching dependency is found
in the parent container.

```javascript
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
```

## Container.prototype.keys()
Returns the names of the dependencies in the current
container. Does not include the keys of any parent container.

```javascript
container.provider('foo', () => 42)
const childContainer = container.extend()
childContainer.provider('bar', () => 43)

expect(childContainer.keys()).toEqual(['bar'])
```

## Cyclic dependencies
Cyclic dependencies can be resolved with the invoke function.
It is however a very good idea to prevent cyclic dependencies
in the first place.

```javascript
container.provider('foo', ({ invoke }) => {
  return {
    bar: () => invoke(({ bar }) => bar)
  }
})

container.provider('bar', ({ invoke }) => {
  return {
    foo: () => invoke(({ foo }) => foo)
  }
})

container.invoke(({ foo, bar }) => {
  expect(foo.bar()).toBe(bar)
  expect(bar.foo()).toBe(foo)
})
```

# Example

```javascript
import Container from '@adrianhelvik/container'

const container = new Container()

container.provider('foo', () => {
  console.log('foo injected')
  return 10
})

container.constant('bar', 'Hello world')

// The dependency 'foo' is now injected into
// the function and the provider for foo is
// called.
container.invoke(({ foo, bar }) => {
  assert.equal(foo, 10)
  assert.equal(bar, 'Hello world')
})
```
