// Usage:
// Call s3.upload(file, props) to upload a single file where file identifies the file to upload and props will
// be sent on to s3.
// Call s3.uploadFiles(files, props) to upload multiple files.  In this case, files should be an array of files
// props:
// The following props can be set(or others specified by s3).  There are default values specified below, so sending in props is not necessary.
//  Note:  'key' is the filename that will be used to store the file on s3.  You can use ${filename} in the string to specify that you want to use
// the filename of the uploaded file.  You can also use ${random} to generate a 20 character random string.  i.e. if you are uploading a file named
// 'cat.png' and specified a key of 'myapp-$(random)-$(filename)', you'd end up with a file named myapp-hald3luckai35lshh8pz-cat.png'
// You can also use ${filebasename} to get 'cat' and ${extension} to get 'png'
//  acl: defaults to 'public-read'
//  success_action_status: 200
//  key: '${filename}'
//

// This call depends on cloud code to be set up to return policySignature.  It calls cloud function s3PolicySignature
// to get appropriate policy/signature for the upload.  Bucket and key must match for this to work.


'use strict';

angular.module('schyllingApp')
	.factory('s3', function ($q, $rootScope, monocle) {
	    // Service logic
	    // ...

		var bucket = "";
		var awsAccessKey = "";
		/* jshint camelcase: false */
		var defaultProps = { acl: 'public-read', success_action_status: 200, key: "${filename}" };

		// Private functions here
		function randomString(length)
		{
			var chars = '0123456789abcdefghiklmnopqrstuvwxyz';
			var sRnd = '';
			var i;
			for (i=0; i<length; i += 1){
				var randomPoz = Math.floor(Math.random() * chars.length);
				sRnd += chars.substring(randomPoz,randomPoz+1);
			}
			return sRnd;
		}

		function uploadFileOrBlob(fileOrBlob, policySignature, props, progressCallback)
		{
			var deferred = $q.defer();
			var xhr = new XMLHttpRequest();

			var fd = new FormData();

			var fileProps = {};

			if (!bucket || !awsAccessKey)
				throw  "Must call s3.initialize(bucket, awsAccessKey) before calling s3.upload()";

			angular.extend(fileProps, defaultProps);
			angular.extend(fileProps, props);

			// Populate the Post parameters.
			var key = fileProps.key;
			fd.append('key', key);
			fd.append('AWSAccessKeyId', awsAccessKey);
			fd.append('acl', fileProps.acl);
			if (fileProps.success_action_status)
				fd.append('success_action_status', fileProps.success_action_status);
			fd.append('policy', policySignature.policy);
			window.console.log(policySignature.policy);
			fd.append('signature', policySignature.signature);
			fd.append('Content-Type', fileProps.ContentType);
			// This file object is retrieved from a file input.
			fd.append('file', fileOrBlob);

			// Keep track of upload progress so that we can message
			// it to the user.
			if (progressCallback)
			{
				xhr.upload.addEventListener('progress', function(e) {
					if(!$rootScope.$$phase) {
						$rootScope.$apply( function() {
							progressCallback(e);
						});
					} else
						progressCallback(e);
				}, false);
			}

			var bucketURL = 'http://' + bucket + '.s3.amazonaws.com/';

			// If the upload completes we should decrement the uploads
			// currently taking place.
			xhr.onreadystatechange = function() {
				var headers;
				if (xhr.readyState !== 4)  { return; }

				if (xhr.status >= 200 && xhr.status < 300)
				{
					headers = xhr.getAllResponseHeaders();
					window.console.log("uploadFileOrBlob resolve");
					$rootScope.$apply( function() {
						deferred.resolve( { url: bucketURL + key} );
					});
				} else
				{
					// Error are returned in xml.  This is an example.  At this point we aren't parsing it to get the error string
					//<?xml version="1.0" encoding="UTF-8"?>
					//<Error><Code>AccessDenied</Code><Message>Invalid according to Policy: Extra input fields: success_action_status</Message><RequestId>0051BF3E880720B4</RequestId><HostId>p0fI7ygiE0MZHfhhWhR67NK38JL5XbQNVpIc+mlIwTpk+BODR1iXGKYw9QWoKv5S</HostId></Error>
					window.console.log("uploadFileOrBlob resolve");
					$rootScope.$apply( function() {
						deferred.reject({httpStatus:xhr.status, error: xhr.responseText});
					});
				}
			};

			xhr.open('POST', bucketURL, true);
			xhr.setRequestHeader("Accept", "application/json");
			xhr.setRequestHeader("Access-Control-Expose-Headers", "location");
			xhr.send(fd);

			return deferred.promise;
		}

		function uploadFile(file, policySignature, props, progressCallback)
		{
			window.console.log(encodeURIComponent(file.name));
			var filename = file.name.replace(/[^.a-z0-9]/gi, '_').toLowerCase();
			var components = filename.split('.');
			var extension = components.pop();
			var fileBasename = components.join('.');
			var thumbnailKey = "${uploadedfilebasename}-thumb.${extension}";
			var uploadedfileBasename;
			var thumbProps = {};
			var promises = [];
			var thumbPromise;
			var TBfilename;
			var contentType;
			var progressFileTotal = 0;
			var progressThumbnailTotal = 0;
			var progressFileLoaded = 0;
			var progressThumbnailLoaded = 0;

			var fileProps = {};
			angular.extend(fileProps, defaultProps);
			angular.extend(fileProps, props);

			// Populate the Post parameters.
			var key = fileProps.key;
			key = key.replace(/\${random}/, randomString(20));
			key = key.replace(/\${filename}/, filename);
			key = key.replace(/\${filebasename}/, fileBasename);
			key = key.replace(/\${extension}/, extension);

			fileProps.key = key;

			window.console.log(key);

			window.console.log(fileProps);

//			fonograf-photo-9t5nhyx7rxtb2q7pia4k.PNG
//			fonograf-photo-382s7vdlbcx5fydgu6nd.PNG

			promises.push( uploadFileOrBlob(file, policySignature, fileProps, function(progress) {
				progressFileTotal = progress.total;
				progressFileLoaded = progress.loaded;
				progressCallback({loaded: progressFileLoaded + progressThumbnailLoaded, total:progressFileTotal + progressThumbnailTotal });
			}) );

			contentType = file.type.split("/")[0];
			if (props.thumbnailOptions && contentType === 'image')
			{
				TBfilename = key.split('/').pop();
				components = TBfilename.split('.');
				extension = components.pop();
				uploadedfileBasename = components.join('.');
				thumbnailKey = props.thumbnailOptions.key;
				thumbnailKey = thumbnailKey.replace(/\${random}/, randomString(20));
				thumbnailKey = thumbnailKey.replace(/\${filename}/, TBfilename);
				thumbnailKey = thumbnailKey.replace(/\${filebasename}/, fileBasename);
				thumbnailKey = thumbnailKey.replace(/\${extension}/, extension);
				thumbnailKey = thumbnailKey.replace(/\${uploadedfilebasename}/, uploadedfileBasename);

				angular.extend(thumbProps, fileProps);
				thumbProps['Content-Type'] = props.thumbnailOptions.imageType;
				thumbProps.key = thumbnailKey;

				thumbPromise = generateThumbnail(file, props.thumbnailOptions).then( function(imageBlob) {
					return uploadFileOrBlob(imageBlob, policySignature, thumbProps, function(progress) {
						progressThumbnailTotal = progress.total;
						progressThumbnailLoaded = progress.loaded;
						progressCallback({loaded: progressFileLoaded + progressThumbnailLoaded, total:progressFileTotal + progressThumbnailTotal, file: file });
					});
				});
				promises.push(thumbPromise);

			}


			return $q.all(promises).then( function(responses) {
				var thumbnail;
				if (responses.length > 1)
					thumbnail = responses[1].url;
				return {url: responses[0].url, thumbnail: thumbnail};
			});
		}

//		thumbnailOptions
//		key
//		imageType
//		jpgCompression
// scaleFactor: if specified, image will be scaled by this amount based on original video dimensions
// maxWidth: if specified, posterFrame will be scaled to have this maximum width while keeping aspect ratio. Ignored if scaleFactor is set
// maxHeight: if specified, posterFrame will be scaled to have this maximum height while keeping aspect ratio. Ignored if scaleFactor maxWidth is set
// imageType: 'image/jpg' will generate jpg.  default is to generate png
// jpgCompression:  Indicates level of jpg compression from 0-1.  Only valid if image-type = 'image/jpeg'

		function generateThumbnail(file, options)
		{
			var deferred = $q.defer();
			window.console.log('generating thumbnail');

			var ctx;
			var image = document.createElement("img");
			image.file = file;
			var reader = new FileReader();
			reader.onload = (function(aImg){
				return function(e){
					aImg.src = e.target.result;
				};
			}(image));

			reader.onerror = function(error)
			{
				deferred.reject("Image file failed to load: " + error);
			};

			reader.onabort = function(error)
			{
				deferred.reject("Image file aborted load: " + error);
			};

			reader.readAsDataURL(file);
			var canvas = document.createElement("canvas");
			options = options || {};

			image.onload = function(){
				var dataURL;
				var blob;
				var scaleFactor = 1;
				var w, h;
				// Check for maxWidth or maxHeight settings
				if (options.maxWidth)
					scaleFactor = options.maxWidth / image.width;
				else if (options.maxHeight)
					scaleFactor = options.maxHeight / image.height;

				if (scaleFactor > 1)
					scaleFactor = 1;

				if(options.scaleFactor)
					scaleFactor = options.scaleFactor;

				w = image.width * scaleFactor;
				h = image.height * scaleFactor;

				canvas.width = w;
				canvas.height = h;
				ctx = canvas.getContext("2d");
				ctx.drawImage(image,0,0, w, h);

				dataURL = canvas.toDataURL(options.imageType, options.imageType ? options.jpgCompression : undefined);
				blob = dataURItoBlob(dataURL, options.imageType || 'image/png');
				deferred.resolve(blob);
			};

			image.onerror = function()
			{
				deferred.reject("Image failed to load");
			};

			image.onabort = function()
			{
				deferred.reject("Image load aborted");
			};

			return deferred.promise;
		}

		function dataURItoBlob(dataURI, blobType) {
			var binary = atob(dataURI.split(',')[1]);
			var array = [];
			for(var i = 0; i < binary.length; i++) {
				array.push(binary.charCodeAt(i));
			}
			return new Blob([new Uint8Array(array)], {type: blobType});
		}

	    // Public API here
		return {
			initialize: function(s3bucket, accessKey, props) {
				bucket = s3bucket;
				awsAccessKey = accessKey;
				angular.extend(defaultProps, props);
			},
			upload: function (file, props, progressCallback ) {
				var promise;

				/* global File */
				if (file instanceof File === false)
					throw "First parameter passed to upload() must be a javascript File object";

				promise = monocle.s3PolicySignature().success( function(response) {
					return uploadFile(file, response.data.result, props, progressCallback);
				});
				return promise;
			},
			uploadFiles: function (files, props, progressCallback) {
				var fileProps = {};
				var promise;
				var progressStatusList = [];

				/* global FileList */
				if (files instanceof FileList === false)
					throw "If only allowing 1 file uploaded at a time, call upload() instead of uploadFiles()";


				angular.extend(fileProps, defaultProps);
				angular.extend(fileProps, props);

				promise = monocle.s3PolicySignature().success( function(response) {
					var allFilesPromises = [];
					angular.forEach( files, function(file, index) {
						file.rslS3UploadIndex = index;
						// start out with a progress status of 0 loaded and file size as total
						progressStatusList[file.rslS3UploadIndex] = {loaded: 0, total: file.size};
						allFilesPromises.push( uploadFile(file, response.data.result, props, function(progress) {
							console.log("Progress for " + file.name + " Total: " + progress.total + " Loaded: " + progress.loaded);
							var totalProgress = {loaded: 0, total: 0};
							progressStatusList[file.rslS3UploadIndex] = progress;
							angular.forEach( progressStatusList, function(fileProgress) {
								if (fileProgress)
								{
									totalProgress.loaded += fileProgress.loaded;
									totalProgress.total += fileProgress.total;
								}
							});

							console.log("Combined Progress Total: " + totalProgress.total + " Loaded: " + totalProgress.loaded);
							progressCallback(totalProgress);
						}) );
					});

					return $q.all(allFilesPromises);
				});
				return promise;
			},
			uploadImageBlob: function (blob, props, progressCallback) {
				var promise;
				window.console.log("uploadImageBlob");
				if (!props.key || props.key.length === 0)
					throw "Must specify 'key' when uploading blob as it has no default file name";

				promise = monocle.s3PolicySignature().success( function(response) {
					window.console.log("got s3 policy back.  now calling uploadFileOrBlob()");
					return uploadFileOrBlob(blob, response.data.result, props, progressCallback);
				});
				return promise;
			}
		};
	});
