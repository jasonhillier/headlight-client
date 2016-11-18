/**
 * Headlight Client base module
 * 
 * @author Jason Hillier <jason.hillier@paviasystems.com>
 * @class HeadlightClient
 * @constructor
 */

var HeadlightClient = function()
{
    function createNew(pFable, pServerURL, pUsername, pPassword)
    {
        // If a valid fable object isn't passed in, return a constructor
		if ((typeof(pFable) !== 'object') || (!pFable.hasOwnProperty('fable')))
			return {new: createNew};
		var _Log = pFable.log;
		var _Settings = pFable.settings;

        var libFS = require('fs');
        var libRm = require('rimraf');
        var libUUID = require('fable-uuid');
        var libStream = require('stream');
        var libRequest = require('request');
        var libEntities = require(__dirname + '/Headlight-Entities').new(pFable);

        var _ServerURL = (pServerURL || _Settings.Headlight.ServerURL) + '/1.0/';
        var _Username = pUsername || _Settings.Headlight.Username;
        var _Password = pPassword || _Settings.Headlight.Password;

        //prepare a buffer directory for operations that require file-on-disk
		var BUFFER_DIR = 'buffer/';

        var REQUEST_TIMEOUT = 60 * 1000; //60 seconds

        /**
         * Login to Headlight
         *
         * @method login
         */
        var login = function(fCallback)
        {
            libRequest({
                method: 'POST',
                url: _ServerURL + 'Authenticate',
                body: {UserName: _Username, Password: _Password},
                json: true,
                jar: true,
                timeout: REQUEST_TIMEOUT
                }, function (pError, pResponse)
                {
                    if (pError || !pResponse.body.UserID)
                    {
                        _Log.error('Failed to authenticate with Headlight API server!');
                        return fCallback('Failed to authenticate!');
                    }

                    _Log.trace('Authenticated with Headlight API');
                    
                    return fCallback();
                }
            );
        }

        /**
         * HTTP GET API request to Headlight
         *
         * @method get
         */
        var get = function(pUrl, fCallback, pNoRetry)
        {
            libRequest({
                method: 'GET',
                url: _ServerURL + pUrl,
                json: true,
                jar: true,
                timeout: REQUEST_TIMEOUT
                }, function (err, pResponse)
                {
                    handleHeadlightResponse(err, pResponse, pNoRetry, function retry()
                    {
                        return get(pUrl, fCallback, true);
                    },
                    fCallback);
                });
        }

        /**
         * HTTP GET basic file download request to Headlight
         *
         * @method getFile
         */
        var getFile = function(pUrl, fCallback)
        {
            return getFileExtended(pUrl, {method: 'GET'}, fCallback);
        }

        /**
         * HTTP GET advanced file download request to Headlight
         *
         * @method getFileExtended
         */
        var getFileExtended = function(pUrl, pOptions, fCallback)
        {
            var tmpBufferFile = generateBufferFileName();
            var tmpErr;
            var tmpResponse;

            _Log.trace('Downloading file from Headlight', {Action: 'Download', URL: pUrl, params: pOptions.body});

            libRequest({
                method: pOptions.method,
                url: _ServerURL + pUrl,
                gzip: true,
                jar: true,
                json: (pOptions.body),
                body: pOptions.body ? pOptions.body : null,
                timeout: pOptions.timeout ? pOptions.timeout : REQUEST_TIMEOUT
                }, function(err, pResponse)
                {
                    tmpErr = err;
                    tmpResponse = pResponse;
                })
                .once('error', function(err)
                {
                    return fCallback(err);
                })
                .pipe(libFS.createWriteStream(tmpBufferFile))
                .once('close', function()
                {
                    return fCallback(tmpErr, tmpResponse, tmpBufferFile);
                });
        }

        /**
         * HTTP POST API request to Headlight
         *
         * @method post
         */
        var post = function(pUrl, pPostData, fCallback, pNoRetry)
        {
            libRequest({
                method: 'POST',
                url: _ServerURL + pUrl,
                body: pPostData,
                json: true,
                jar: true,
                timeout: REQUEST_TIMEOUT
                }, function (err, pResponse)
                {
                    handleHeadlightResponse(err, pResponse, pNoRetry, function retry()
                    {
                        return post(pUrl, pPostData, fCallback, true);
                    },
                    fCallback);
                });
        }

        /**
         * Save stream to RemoteFS
         *
         * @method uploadFile
         */
        var uploadFile = function(pFileName, pContentType, pFileStream, fCallback)
        {
            return uploadFileExtended(pFileName, {}, pContentType, pFileStream, fCallback);
        }

        /**
         * Save stream to Artifact endpoint
         *
         * @method uploadArtifact
         */
        var uploadArtifact = function(pIDArtfact, pVersion, pContentType, pFileStream, fCallback)
        {
            tmpFileName = pVersion;

            return uploadFileExtended(tmpFileName, {url: `Artifact/Media/${pIDArtfact}/`}, pContentType, pFileStream, fCallback);
        }

        /**
         * Save stream to RemoteFS
         *
         * @method uploadFile
         */
        var uploadFileExtended = function(pFileName, pOptions, pContentType, pFileStream, fCallback)
        {
            var tmpUrl = 'Media/';
            if (pOptions.url)
                tmpUrl = pOptions.url;
            
            var tmpRequest = libRequest({
                method: 'POST',
                url: `${_ServerURL}${tmpUrl}${pFileName}`,
                timeout: pOptions.timeout ? pOptions.timeout : REQUEST_TIMEOUT,
                headers:
                {
                    'Content-Type': pContentType
                },
                jar: true
            });

            pFileStream.pipe(tmpRequest);

            tmpRequest.once('error', function(pError)
            {
                _Log.error('[RemoteFS] ERROR Saving file to grid', pError);

                return fCallback(pError);
            });

            tmpRequest.once('response', function(pResponse)
            {
                _Log.trace('[RemoteFS] Saved file to grid', pFileName);

                return fCallback(null, pResponse);
            });
        }

        /**
         * Download file from RemoteFS
         *
         * @method downloadFile
         */
        var downloadFile = function(pFileName, fCallback)
        {
            return downloadFileExtended(pFileName, {}, fCallback);
        }

        /**
         * Download file from RemoteFS
         *
         * @method downloadFile
         */
        var downloadArtifact = function(pIDArtifact, pVersion, fCallback)
        {
            tmpFileName = pVersion;

            return downloadFileExtended(tmpFileName, {url: `Artifact/Media/${pIDArtifact}/`}, fCallback);
        }

        /**
         * Download file from RemoteFS
         *
         * @method downloadFileExtended
         */
        var downloadFileExtended = function(pFileName, pOptions, fCallback)
        {
            var tmpUrl = 'Media/';
            if (pOptions.url)
                tmpUrl = pOptions.url;
            
            // Check if the file is already there -- and overwrite if necessary.
            _Log.trace('Looking up file in RemoteFS', pFileName);

            var tmpResponseObject = libRequest({
                method: 'GET',
                url: `${_ServerURL}${tmpUrl}${pFileName}`,
                json: false, //file download
                jar: true,
                timeout: pOptions.timeout ? pOptions.timeout : REQUEST_TIMEOUT,
                encoding: null
            }, function(pError, pResponse, pBody)
            {
                if (pError)
                    return fCallback('[downloadFromGrid] Error:' + pError);

                if (pResponse.statusCode !== 200)
                {
                    return fCallback('File not found!');
                }

                //bug fix for request lib: https://github.com/request/request/issues/887
                // Create an in-memory Readable stream to store the binary response data
                var tmpOutStream = new libStream.Readable();
                tmpOutStream.push(pBody);
                tmpOutStream.push(null); //indicate EOF
                tmpOutStream.destroy = function() {}; //this isn't implemented on base/default Readable type

                var tmpContentType = pResponse.headers['content-type'];
                return fCallback(null, {name: pFileName, contentType: tmpContentType}, tmpOutStream);
            });
        }

        /**
         * Check if file exists in RemoteFS
         *
         * @method checkIfFileExists
         */
        var checkIfFileExists = function(pFileName, fCallback)
        {
            // Check if the file is already there
            get('Media/Count/' + pFileName, function(err, pResponse)
            {
                if (err)
                    return fCallback(err);
                else
                    return fCallback(null, pResponse.body.Count > 0);
            });
        }

        //=====

        /**
         * Internal method to handle responses from Headlight server.
         *
         * @method handleHeadlightResponse
         */
        var handleHeadlightResponse = function(pError, pResponse, pNoRetry, fRetry, fCallback)
        {
            if (!pNoRetry &&
                (pError || pResponse.body.Error)) //TODO: check status code
            {
                _Log.warn('Headlight API error. Attempting to re-authenticate...', {Error: pError || pResponse.body.Error});

                login(function(err, response)
                {
                    if (err)
                        return fCallback("Failed to login to Headlight!");

                    return fRetry();
                });
            }
            else
            {
                return fCallback(null, pResponse);
            }
        }

        /**
         * Internal method to create temporary files on disk
         *
         * @method generateBufferFileName
         */
        var generateBufferFileName = function()
		{
            try
			{
                if (!libFS.existsSync(BUFFER_DIR))
                {
                    libRm.sync(BUFFER_DIR);
                    libFS.mkdirSync(BUFFER_DIR);
                }
			} catch (ex)
			{
				_Log.warn('Trouble accessing directory: ' + BUFFER_DIR);
			}

			return BUFFER_DIR + libUUID.getUUID();
		}

        /**
		* Container Object for our Factory Pattern
		*/
		var tmpHeadlightClient = (
		{
            login: login,
			get: get,
			getFile: getFile,
			getFileExtended: getFileExtended,
			post: post,
			uploadFile: uploadFile,
            uploadFileExtended: uploadFileExtended,
            uploadArtifact: uploadArtifact,
			downloadFile: downloadFile,
            downloadFileExtended: downloadFileExtended,
            downloadArtifact: downloadArtifact,
			checkIfFileExists: checkIfFileExists,
			//findFilesInGrid: findFilesInGrid,
			//deleteFileInGrid: deleteFileInGrid,
            Entities: libEntities,
			new: createNew
		});

		return tmpHeadlightClient;
	}

	return createNew();
};

module.exports = new HeadlightClient();