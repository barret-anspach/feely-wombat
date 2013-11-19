strapApp = angular.module('schyllingApp');

strapApp.factory('monocle', ['$http', 'parseWrapper', ($http, parseWrapper) ->


	class Strap extends parseWrapper.Resource
		constructor: (objectId) ->
			super(objectId)

		@parseClassName: "Strap"
		@register: () ->
			name: undefined,
			type: undefined,
			quantity: undefined,




	monocle =
		initialize: () ->
			$http.defaults.headers.common['X-Parse-Application-Id'] = 'vsph4BARvMHNuQJoRU1lDxhxg1otvLCa4ArSrERA'    # beat-1
			$http.defaults.headers.common['X-Parse-REST-API-Key'] = '9scmvh4r75QgFKiWau9nwyhXzwt2z18AQu1D3pKA'      # beat-1


	monocle.Network = parseWrapper.Resource.registerResource(Strap)


	monocle.initialize()

	return monocle
])
