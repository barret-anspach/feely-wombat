angular.module('schyllingApp').factory('parseWrapper', ['$http', '$filter','$cookieStore', '$q', '$log', ($http, $filter, $cookieStore, $q, $log) ->

	# A note about Promises:  Just wanted to document what I have learned about promises...
	# I had originally thought that the promise object returned from a call would morph into the correct object when the
	# promise was fullfilled.  i.e. I could call data = query.fetch() and fetch would return the promise and later when fullfilled,
	# data would containt the results of the query.  It does not do this and clearly this could not work with numbers, etc.
	# Instead, the "result" is passed into the function that is passed to then().  When cascading then() calls, the value returned from
	# a then() function will be the new result that is passed into subsequent then functions.  i.e. promise.then( (x) -> return x+3).then( (y)-> return y *2).then( (z)-> log z)
	# if the first result is 4, it will be sent into x as 4, y will be 7 and z will be 14
	#
	# Angular's $q only supports then().  It does not support fail() or done() as the Q promise library does

	# When we get a list of objects back from a query, we want to transform them into class objects(i.e. turn Object into Venue)
	# We do that here
	_parseTransformResponse = (data, resourceClassName) ->
		data = angular.fromJson(data, true);
		if (data.results and data.results.length > 0)
			resourceClass = Resource.resourceClassForName(resourceClassName)
			newResults = []
			for item in data.results
				classItem = new resourceClass()
				classItem._copyData(item)
				newResults.push(classItem)
				#transform any pointers to their associated classes
				_swapPointersForInstances(classItem)

			data.results = newResults

		return data

	# Queries will return with Pointers indetified as generic object with __type, className and objectId.  We want to convert these
	# generic objects into instances of the appropriate class and swap the new instances in place of the generic objects
	_swapPointersForInstances = (item) ->
		for own propName of item
			prop = item[propName]
			if prop instanceof Object and prop.__type == "Pointer"
				pointerClass = Resource.resourceClassForName(prop.className)
				console.error("Cannot find Resource Class for resource '" + prop.className + "'") if !pointerClass
				newPointer = new pointerClass(prop.objectId)
				item[propName] = newPointer
			# For an object that was "included" in a query, it will come back with type "Object".  We want to convert those to instances too.
			if prop instanceof Object and prop.__type == "Object"
				resourceClass = Resource.resourceClassForName(prop.className)
				console.error("Cannot find Resource Class for resource '" + prop.className + "'") if !resourceClass
				newResource = new resourceClass(prop.objectId)
				newResource._copyData(prop)
				item[propName] = newResource

	_swapInstancesForPointers = (itemInstance) ->
		for own propName of itemInstance
			prop = itemInstance[propName]
			if prop instanceof Object
				newInstance = _swapInstancesForPointers(prop)
				if (newInstance)
					itemInstance[propName] = newInstance

			if prop instanceof Array
				for item, index in itemInstance
					newInstance = _swapInstancesForPointers(item)
					itemInstance[index] = newInstance if newInstance

		if itemInstance instanceof Resource
			return itemInstance.asPointer()

		return null

			# This is similar to $http except that we swap the error and success callbacks out for ones that work for us, notably the
	# returned object is passed as the first param and an object with headers and config is passed second
	_http = (config) ->
		promise = $http(config)
		_addSuccessAndErrorCallbacks(promise)
		return promise

	# $http.sucess() and error() callbacks are incorrect in that they don't return the correct promise, so they aren't actually chainable
	# The code looks like...
	#   promise.success = function(fn) {
	#       promise.then(function(response) {
	#           fn(response.data, response.status, response.headers, config);
	#       });
	#       return promise;
	#  };
	# which returns the original promise and not the new promise potentially returned by the called function.  It seems it should have been
	#   promise.success = function(fn) {
	#       newPromise = promise.then(function(response) {
	#           fn(response.data, response.status, response.headers, config);
	#       });
	#       return newPromise;
	#  };

	_addSuccessAndErrorCallbacks = (promise) ->
		promise.success = (fn) =>
			newPromise = promise.then(fn)
			_addSuccessAndErrorCallbacks(newPromise)
			return newPromise


		promise.error = (fn) =>
			newPromise = promise.then(null, fn)
			_addSuccessAndErrorCallbacks(newPromise)
			return newPromise


	class GeoPoint
		constructor: (latitude, longitude) ->
			this.latitude = latitude
			this.longitude = longitude
			this.__type = "GeoPoint"

	class Query

	# ------- PROPERTIES ----------
	# whereClause: String       This is the guts of the query.  It specifies the query filters.  See parse.com for examples of usage
	# limit: int                This will cap the number of responses to the set amount.  i.e. if set to 50, reponse will have at most 50 items.  Default is 50
	# skip: int                 Offset into query in which to get items.  To be used with limit to get batches of items instead of getting all at once.
	# isBusy:bool               true if Query is awaiting repsonse from server, false if not awaiting response
	# error: Object             Error will be set if the webservice call fails
	# mightHaveMore: bool       Inidication as to whether there may be more items in the collection.  If you ask for a certain number of items and get back fewer, then we decide mightHaveMore is false

	# ------- Query constructor ----------
	# This should not be called by client code.  Get query from specific resource class or from collection.  i.e. elvis.Venue.query() or myVenue.mediaAssets.query()
		constructor: (targetClass, whereClause) ->
			this.targetClass = targetClass
			_swapInstancesForPointers(whereClause)
			this.whereClause = whereClause
			this.order = []
			this.fieldsToInclude = []
			this.limit = 100
			this.skip = 0
			this.isBusy = false
			this.error = null
			this.mightHaveMore = true
			this.queryChangedWhileInProgress = false

		# ------- ascending ----------
		# Sort the query in scending order by the specified key.  Multiple ordering keys can be applied to the same query and will be prioritized in the order they were added.
		#  i.e. Venue.query().ascending("name").descending("").fetch()
		ascending: (orderKey) ->
			this.order.push(orderKey)
			this.queryChangedWhileInProgress = true if this.collectionPromise
			return this

		# ------- descending ----------
		descending: (orderKey) ->
			this.order.push("-#{orderKey}")
			this.queryChangedWhileInProgress = true if this.collectionPromise
			return this

		# ------- include ----------
		include: (fieldToInclude) ->
			this.fieldsToInclude.push(fieldToInclude)
			this.queryChangedWhileInProgress = true if this.collectionPromise
			return this

		howMany: (limit) ->
			this.limit = limit
			return this
		# ------- fetch ----------
		# Make the call to the server to do the query.  Takes no parameters as the Query should be set up beforehand
		# returns a promise which means that success() and error() can be called on the return value to get called
		# after the server responds.  After fetch() is complete, the response will be store in the 'items' property
		# of the query.  Calling fetch() on a query that has already been fecthed will redo the query
		fetch: () ->
			this.items = []
			this._fetchMore(this.limit, this.skip)



		# ------- more ----------
		# Calls the server again with the same query, but with an offset equal to the amount
		# if howManyMore is not specified, it'll use this.limit to determine how many more to get
		more: (howManyMore) ->
			howManyMore = this.limit if !howManyMore
			this._fetchMore(howManyMore, this.items.length)

		_fetchMore: (limit, skip) ->
			this.error = null
			params = { }


			# if we have a query active and it has not changed, return the existing promise
			if (this.collectionPromise)
				throw "Calling fetch() on a query that was changed while it was in progress.  Not allowed!" if this.queryChangedWhileInProgress
				return this.collectionPromise;

			# Angular will not output javascript properties that start with '$' because they use '$' as an indicator
			# of their own stuff.  Because of this, we convert to json ourselves
			params.where = JSON.stringify(this.whereClause) if this.whereClause?
			params.limit = limit
			params.skip = skip
			params.order = this.order.join(",") if this.order.length > 0
			params.include = this.fieldsToInclude.join(",") if this.fieldsToInclude.length > 0

			config = { method: "GET", url: this._getURL(), params: params, transformResponse: (data) => _parseTransformResponse(data, this.targetClass) }

			collectionPromise = _http(config)
			this.isBusy = true
			this.collectionPromise = collectionPromise.then(
				(response) =>
					this.mightHaveMore = false if response.data.results.length < params.limit
					this.isBusy = false;
					this.items = this.items.concat(response.data.results)
					this.collectionPromise = null;
					this.queryChangedWhileInProgress = false
					return this.items;
				(errorResponse) =>
					this.isBusy = false;
					this.error = { httpStatus: errorResponse.status, code: errorResponse.data.code, error: errorResponse.data.error }
					this.collectionPromise = null;
					this.queryChangedWhileInProgress = false
					return this.error;
			)
			_addSuccessAndErrorCallbacks(this.collectionPromise);

			return this.collectionPromise

		_getURL: () ->
			return "https://api.parse.com/1/classes/#{this.targetClass}"

	class Resource
	# ------- PROPERTIES ----------
	# objectId: String          ObjectId of the parse object that this represents
	# isBusy:bool               true if Resource is awaiting repsonse from server, false if not awaiting response
	# isLoading:bool            more specific than isBusy, this will be true only if awaiting response to load call from webserver
	# isSaving:bool             more specific than isBusy, this will be true only if awaiting response to save call from webserver
	# isDeleting:bool           more specific than isBusy, this will be true only if awaiting response to delete call from webserver
	# error: Object             Error will be set if the webservice call fails
		constructor: (objectId) ->
			this.objectId = objectId || null;
			this.isBusy = false;
			this.isSaving = false;
			this.isLoading = false;
			this.isDeleting = false;
			this.error = null
			this._initClassProperties()

		# ------- query ----------
		# Static method that returns a new Query object with this class as the target
		# takes where clause of query as argument
		# usage:  elvis.Venue.query({name: "Jones"})
		@query: (whereClause) ->
			# CoffeeScript way of getting name of class MyClass.name
			return new Query(this.parseClassName, whereClause)

		# ------- registerResource ----------
		# Static method that registers a resource class with the name that is used for that class in Parse.
		# Typically, they will be the same name, so it would read
		# x.Place = parseWrapper.Resource.registerResource("Place", Place)
		# Registering allows the parseWrapper to return Classes for the objects returned
		# in a query instead of just returning Objects
		@registerResource: (resourceClass) ->

#			if (resourceClass.parseClassName == '_User')
#				window.console.log(resourceClass)

			existingResourceClass = this.registeredResources[resourceClass.parseClassName];
			return existingResourceClass if existingResourceClass

			#cache off the list of properties that are persisted for a given class.  These properties
			# will be copied into the json for sending to back end
			resourceClass.persistedProperties = resourceClass.register()

			# when minified, contructor.name does not work for coffeescript files as the classes are renamed,
			# so instead, we save off the class name here
#			resourceClass.parseClassName = resourceName;

			this.registeredResources[resourceClass.parseClassName] = resourceClass



		# ------- load ----------
		# Call server to get updated properties for this resource.  Resource must have an objectId or exception will be thrown.
		# Call returns a promise which means that success() and error() can be called on the return value to get called
		# after the server responds.
		load: () ->
			return this.loadWithProperties();

		# ------- loadWithProperties ----------
		# Similar to load() except you can pass in an array of property names for pointer properties and they will be filled in with
		# the property object instead of just the pointer.  i.e. passing 'metroArea' to load of a Place will fill in the metroArea object
		# you can pass in a single string, like 'metroArea' or and array like '[place, metroArea]'
		# Does not work for relations.
		loadWithProperties: (arrayOfPointerPropsToLoad) ->
			throw "Cannot load resource!  obejctId is not set." if this.objectId == null or this.objectId == undefined

			pointerNames = []
			collectionNames = []
			if arrayOfPointerPropsToLoad
				propsArray = if arrayOfPointerPropsToLoad instanceof Array then arrayOfPointerPropsToLoad else [arrayOfPointerPropsToLoad]
				collectionNames = this._cullCollectionNamesFromList(propsArray);
				pointerNames = _.difference(propsArray, collectionNames);

			includes = pointerNames.join(",")

			config =  { method: "GET", url: this._getURL(this) }

			config.params = { include: includes } if includes and includes.length > 0

			# If we are already doing a load(), then just return the existing load promise
			if (this.completeLoadPromise)
				return this.completeLoadPromise;


			this.isLoading = true;
			this.isBusy = true;


			# Make the first call to load the requested object
			loadPromise = _http(config).then( (response) =>
				this._copyData(response.data)
				_swapPointersForInstances(this)

				return this;
			)

			# if we are getting properties, then we'll be making several calls.  We want all calls to complete before calling success and error
			# callbacks, so we collect the individual promises returned by each call and place them into a promise of their own which will
			# be called when they are all finished
			promises = [loadPromise];

			# Now make calls to load any relation properties
			for collectionName in collectionNames
				collection = this[collectionName]
				collectionPromise = collection.query().fetch().success( (query) =>
					this[collectionName + "List"] = query.items
				)
				promises.push( collectionPromise )

			this.completeLoadPromise = $q.all(promises).then(
				(promisesReponses) =>
					this.isLoading = this.isBusy = false;
					this.completeLoadPromise = null
					# we return 'this' here so that the load() returns the expected object.  we don't want load returning a list of promises
					return this
				(errorResponse) =>
					this.isLoading = this.isBusy = false;
					this.completeLoadPromise = null
					this.error = { httpStatus: errorResponse.status, code: errorResponse.data.code, error: errorResponse.data.error }
					throw this.error;
			)

			_addSuccessAndErrorCallbacks(this.completeLoadPromise)

			return this.completeLoadPromise




		# ------- save ----------
		# Create a new object on the backend with the properties applied to this resource or update an existing resource
		# Any changes to a resource's collections will not be persisted on the backend until save() is called on the resource
		# Call returns a promise which means that success() and error() can be called on the return value to get called
		# after the server responds.
		save: () ->
			this._save({})


		# ------- isNew ----------
		# returns true if this is a new resource that has not been saved to backend.  false if this is a resource that was retrieved
		# from the backend and therefore has previously been saved
		isNew: () ->
			return this.objectId == null || this.objectId == undefined;

		# ------- asPointer ----------
		# returns the Parse pointer representation of this object.  Used in where clauses for comparing objects.
		# Place.query({metroArea: metroArea.asPointer()})
		asPointer: () ->
			pointerJsonForResource(this)

		_initClassProperties: () ->
			# We copy properties from the persistedProperties object stored on the class.  For Collections, we want to create
			# new instances of teh collection so every instance has their own collection
			for prop of this.constructor.persistedProperties
				propValue = this.constructor.persistedProperties[prop];
				if (propValue instanceof Collection)
					this[prop] = new propValue.constructor(propValue.resourceName)
					this[prop].resource = this
					this[prop].collectionName = prop;
				else
					this[prop] = propValue

		_save: (extraProperties) ->
			config = method: "PUT", url: this._getURL(this)
			config.method = "POST" if this.isNew()

			config.data = this._propertiesAsJson();
			angular.extend(config.data, extraProperties)

			# At this point we only allow 1 ajax call to be active at a time for a given resource,
			# so if we already have one going, note it in console and bail
			if (this.isBusy)
				window.console.log("Ajax call to #{config.method}: #{config.url} was aborted because another ajax call is already in progress")
				return

			this.isSaving = true;
			this.isBusy = true;

			ajaxCall = _http(config).success( (response) =>
				this._copyData(response.data)
				this.isSaving = this.isBusy = false;

				# we've saved any collection modifications, so clear the collections
				for own prop of this
					method = if this[prop]? then this[prop]._clearOperations else null
					if (typeof method == 'function')
						this[prop]._clearOperations();

				return this;

			).error( (errorResponse) =>
				this.isSaving = this.isBusy = false;
				throw errorResponse;
			)

		delete: () ->
			config = method: "DELETE", url: this._getURL(this)

			# At this point we only allow 1 ajax call to be active at a time for a given resource,
			# so if we already have one going, note it in console and bail
			if (this.isBusy)
				window.console.log("Ajax call to #{config.method}: #{config.url} was aborted because another ajax call is already in progress")
				return

			this.isDeleting = true;
			this.isBusy = true;

			ajaxCall = _http(config).success( (response) =>
				this.isDeleting = this.isBusy = false;

				# we've saved any collection modifications, so clear the collections
				for own prop of this
					method = if this[prop]? then this[prop]._clearOperations else null
					if (typeof method == 'function')
						this[prop]._clearOperations();

				return this;

			).error( (errorResponse) =>
				this.isDeleting = this.isBusy = false;
				throw errorResponse;
			)

		_getURL: () ->
			return "https://api.parse.com/1/classes/#{this.constructor.parseClassName}" if this.isNew()
			return "https://api.parse.com/1/classes/#{this.constructor.parseClassName}/#{this.objectId}"

		# convert existing resource properties into json that parse is expecting
		_propertiesAsJson: () ->
			json = {}
			throw "registerResource() was not called on class #{this.constructor.parseClassName}!" if !this.constructor.persistedProperties
			for own propName of this
				# we only use properties that we defined in the class @register method
				if (this.constructor.persistedProperties.hasOwnProperty(propName))
					propValue = this[propName];
					if (propValue instanceof Collection)
						if (propValue.resourcesToAdd.length > 0)
							json[propName] = {__op:"AddRelation", objects: pointerJsonForArray(propValue.resourcesToAdd)}
						else if (propValue.resourcesToRemove.length > 0)
							json[propName] = {__op:"RemoveRelation", objects: pointerJsonForArray(propValue.resourcesToRemove)}
					else if (propValue instanceof Resource)
						json[propName] = pointerJson(propValue)
					else
						json[propName] = propValue
			return json

		_cullCollectionNamesFromList: (propsArray) ->
			collectionNames = []
			for propName in propsArray
				if this[propName] and this[propName] instanceof Collection
					collectionNames.push(propName)
			return collectionNames

		_copyData: (dataToCopy) ->
			# do not copy collections data as they will be returned from the call and will not be collections
			for own prop of dataToCopy
				propValue = dataToCopy[prop]
				unless (propValue instanceof Object and propValue.__type == "Relation")
					this[prop] = propValue


		@registeredResources: {}

		@resourceClassForName: (resourceName) ->
			return this.registeredResources[resourceName]



	class Collection
	# ------- PROPERTIES ----------
	# there are no properties that should need to be accessed from client code

	# ------- constructor ----------
	# Collection constructor.  Takes string as name of resource type that is in the collection
	# This should only be called from the @register function of a newly defined resource class
		constructor: (resourceName) ->
			this.resourceName = resourceName
			this.resourcesToAdd = []
			this.resourcesToRemove = []
			this.operations = []

		# ------- add ----------
		# add a resource or array of resources to this collection.  This does not make a call to the server and this will not add the resource to any existing queries
		# save() must be called on the resource containing this collection in order for the changes to the collection to be saved to server
		add: (resourceOrResourceArray) ->
			throw "Param passed to add is not a Resource object as it should be" if resourceOrResourceArray not instanceof Resource and resourceOrResourceArray not instanceof Array
			throw "Cannot add to a collection that already has items to remove.  Save first, then remove" if this.resourcesToRemove.length > 0
			resourceArray = if (resourceOrResourceArray instanceof Array) then resourceOrResourceArray else [resourceOrResourceArray]
			(this.resourcesToAdd.push(resource) for resource in resourceArray)

		# ------- remove ----------
		# remove a resource or array of resources from this collection.  This does not make a call to the server and this will not remove the resource from any existing queries
		# save() must be called on the resource containing this collection in order for the changes to the collection to be saved to server
		remove: (resourceOrResourceArray) ->
			throw "Param passed to remove is not a Resource object as it should be" if resourceOrResourceArray not instanceof Resource and resourceOrResourceArray not instanceof Array
			throw "Cannot remove from a collection that already has items to add.  Save first, then add" if this.resourcesToAdd.length > 0
			resourceArray = if (resourceOrResourceArray instanceof Array) then resourceOrResourceArray else [resourceOrResourceArray]
			(this.resourcesToRemove.push(resource) for resource in resourceArray)

		# ------- query ----------
		# return a Query that is targetted at this collection
		# fetch() must be called on the Query to do the webservice call
		query: (whereClause) ->
			ourWhereClause = angular.copy(whereClause || {})
			ourWhereClause.$relatedTo = { object: pointerJson(this.resource), key: this.collectionName }
			throw "collectionName is not set for collection of #{this.resourceName}" if !this.collectionName
			return new Query(this.resourceName, ourWhereClause);

		_clearOperations: () ->
			this.resourcesToAdd = []
			this.resourcesToRemove = []

	class User extends Resource
#		password = "Hammer"

		constructor: (userId) ->
			this.isAuthenticating = false;
			this.email = undefined
			this.username = undefined
			super(userId)


		# This will not be part of class, but will be closure variable such that it is not visible outside this closure
		currentUser = null

		@parseClassName: "_User"

		@register: () ->
			email: undefined
			username: undefined


		@login: (username, password) ->
			user = new User;
			user.username = username
			user.login(password)

		@loggedIn: () ->
			return User.current()?

		@current: () ->
			return currentUser if currentUser?

			# We don't have one in js, check cookies
			if ($cookieStore.get("user_id") && $cookieStore.get("sessionToken"))
				currentUser = new User($cookieStore.get("user_id"))
				$http.defaults.headers.common['X-Parse-Session-Token'] = $cookieStore.get("sessionToken")
				currentUser.load()

			return currentUser

		@requestPasswordReset: (emailAddress) ->
			config = { method: "POST", url: "https://api.parse.com/1/requestPasswordReset", data: {email: emailAddress} }

			this.isBusy = true;
			ajaxCall = _http(config).success( (response) =>
				this.isBusy = false;
				return response;
			).error( (errorResponse) =>
				this.isBusy = false;
				throw errorResponse;
			)

		#		authenticated: () ->

		signUp: (password) ->
			this.isAuthenticating = true;
			return this._save({password: password}).success( (data, status, headers, config) =>
				this.isAuthenticating = false;
				this.login(password);
			).error( (errorResponse) =>
				this.isAuthenticating = false;
				throw errorResponse;
			)

		login: (password) ->
			config = { method: "GET", url: "https://api.parse.com/1/login", params: {username: this.username, password: password} }

			this.isAuthenticating = this.isBusy = true;

			ajaxCall = _http(config).success( (response) =>
				this._copyData(response.data)
				_swapPointersForInstances(this)

				this.isAuthenticating = this.isBusy = false;
				$http.defaults.headers.common['X-Parse-Session-Token'] = response.data.sessionToken;
				$cookieStore.put("username", this.username)
				$cookieStore.put("user_id", this.objectId)
				$cookieStore.put("sessionToken", response.data.sessionToken)

				currentUser = this

				return this;

			).error( (errorResponse) =>
				this.isAuthenticating = this.isBusy = false;
				throw errorResponse;
			)
			return ajaxCall

		logOut: () ->
			currentUser = null
			delete $http.defaults.headers.common['X-Parse-Session-Token']
			$cookieStore.remove("username")
			$cookieStore.remove("user_id")
			$cookieStore.remove("sessionToken")


		isCurrent: () ->
			this.objectId and User.current?.objectId == this.objectId

		_getURL: () ->
			return "https://api.parse.com/1/users" if this.isNew()
			return "https://api.parse.com/1/users/#{this.objectId}"


	parseWrapper =
		Resource: Resource
		Collection: Collection
		Query: Query
		User: User
		GeoPoint: GeoPoint
		registerFunction: (functionName) ->
			return 	(params) ->
				config = method: "POST", url: "https://api.parse.com/1/functions/#{functionName}"
				config.data = {}
				angular.extend(config.data, params);
				return _http(config);

	# These are helper methods that take a resource(or array of resources) and return an json object
	# in the Pointer form that is expected by Parse
	pointerJson = (resourceOrResourceArray) ->
		if (resourceOrResourceArray instanceof Array)
			pointerJsonForArray(resourceOrResourceArray)
		else
			pointerJsonForResource(resourceOrResourceArray)

	pointerJsonForResource = (resource) ->
		throw "Cannot convert object to Pointer.  Object has not been saved!" if resource.objectId == null
		obj = {	__type:"Pointer", className:resource.constructor.parseClassName, objectId:resource.objectId }

	pointerJsonForArray = (resourceArray) ->
		(pointerJsonForResource(resource) for resource in resourceArray)


	return parseWrapper
])
