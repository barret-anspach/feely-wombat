'use strict'

describe 'Service: Test', () ->

  # load the service's module
  beforeEach module 'schyllingApp'

  # instantiate service
  Test = {}
  beforeEach inject (_Test_) ->
    Test = _Test_

  it 'should do something', () ->
    expect(!!Test).toBe true
