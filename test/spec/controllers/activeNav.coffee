'use strict'

describe 'Controller: ActivenavCtrl', () ->

  # load the controller's module
  beforeEach module 'schyllingApp'

  ActivenavCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    ActivenavCtrl = $controller 'ActivenavCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
