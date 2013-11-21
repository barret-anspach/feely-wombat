strapApp = angular.module('schyllingApp');

strapApp.factory('monocle', ['$http', 'parseWrapper', ($http, parseWrapper) ->



#	This defines your CLASSES -- which is a type of object in your Parse Data Browser
#	Just copy this code exactly when you want to keep track of a new class, just change the name of it and the properties
#	Then add it to the monocle object below by typing monocle.ClassName = parseWrapper.Resource.registerResource(ClassName)
	class Strap extends parseWrapper.Resource
		constructor: (objectId) ->
			super(objectId)

		@parseClassName: "Strap"
		@register: () ->
			#this is where you define your classes properities -- or column names
			name: undefined,
			type: undefined,
			quantity: undefined,
			imgUrl: undefined



	monocle =
		initialize: () ->
			$http.defaults.headers.common['X-Parse-Application-Id'] = 'vsph4BARvMHNuQJoRU1lDxhxg1otvLCa4ArSrERA'    # beat-1
			$http.defaults.headers.common['X-Parse-REST-API-Key'] = '9scmvh4r75QgFKiWau9nwyhXzwt2z18AQu1D3pKA'      # beat-1


#	This is where you define your service === it's defining monocle.Strap so that you can access from any controller
#	That you inject monocle in -- so if you add a new class above, make sure to copy the following line and substituting
#	Whatever ClassName you used
	monocle.Strap = parseWrapper.Resource.registerResource(Strap)


	monocle.initialize()

	return monocle
])
