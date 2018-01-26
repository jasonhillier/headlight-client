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
        var tough = require('tough-cookie');
        var Cookie = tough.Cookie;
        var libEntities = require(__dirname + '/Headlight-Entities').new(pFable);
        var libUtils = require(__dirname + '/Headlight-Utils').new(pFable);

        var _ServerURL = (pServerURL || _Settings.Headlight.ServerURL) + '/1.0/';
        var _Username = pUsername || _Settings.Headlight.Username;
        var _Password = pPassword || _Settings.Headlight.Password;

        var _CookieJar = libRequest.jar();
        var _CurrentSession = null;

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
                //jar: _CookieJar,
                timeout: REQUEST_TIMEOUT
                }, function (pError, pResponse)
                {
                    if (pError || !pResponse.body.UserID)
                    {
                        _Log.error('Failed to authenticate with Headlight API server!');
                        return fCallback('Failed to authenticate!');
                    }

                    _Log.trace('Authenticated with Headlight API');
                    //manually process cookies (ignoring domain)
                    for (let i=0; i<pResponse.headers['set-cookie'].length; i++)
                    {
                        //console.log('==>', pResponse.headers['set-cookie'][i]);
                        var tmpCookie = Cookie.parse(pResponse.headers['set-cookie'][i]);
                        //console.log(tmpCookie);
                        _CookieJar.setCookie(tmpCookie, _ServerURL);
                    }
                    console.log('COOKIE DEBUG', _CookieJar._jar.store.idx);

                    _CurrentSession = pResponse.body;
                    
                    return fCallback();
                }
            );
        }

        var loginWithCredentials = function(pCredentials, fCallback)
        {
            _Username = pCredentials.Username;
            _Password = pCredentials.Password;

            return login(fCallback);
        }

        var loginWithSession = function(pSessionToken, fCallback)
        {
            //console.log(pSessionToken);

            _CookieJar.setCookie(libRequest.cookie(`UserSession=${pSessionToken}`), _ServerURL);

            libRequest({
                method: 'GET',
                url: _ServerURL + '/CheckSession',
                json: true,
                jar: _CookieJar,
                timeout: REQUEST_TIMEOUT
                }, function (pError, pResponse)
                {
                    if (pError || !pResponse.body.UserID)
                    {
                        _Log.error('Failed to authenticate with Headlight API server!');
                        return fCallback('Failed to authenticate!');
                    }

                    _Log.trace('Authenticated with Headlight API');
                    _CurrentSession = pResponse.body;
                    
                    return fCallback(null, pResponse.body);
                });
        }

        /**
         * HTTP GET API request to Headlight
         *
         * @method get
         */
        var get = function(pUrl, fCallback, pNoRetry)
        {
            return request(pUrl, {}, fCallback, pNoRetry);
        }

        /**
         * HTTP request to Headlight
         *
         * @method request
         */
        var request = function(pUrl, pOptions, fCallback, pNoRetry)
        {
            if (!pOptions) pOptions = {};

            libRequest({
                method: pOptions.method ? pOptions.method : 'GET',
                url: _ServerURL + pUrl,
                json: true,
                jar: _CookieJar,
                body: pOptions.body ? pOptions.body : null,
                timeout: REQUEST_TIMEOUT
                }, function (err, pResponse)
                {
                    handleHeadlightResponse(err, pResponse, pNoRetry, function retry()
                    {
                        return request(pUrl, pOptions, fCallback, true);
                    },
                    fCallback);
                });
        }

        /**
         * Recursively call GET until error, page runs out, or invoker cancels it.
         *
         * @method get
         */
        getAllRecordsPaged = function(pUrl, pOptions, pSize, fIterator, fCallback)
        {
            if (!fIterator)
            {
                fIterator = (pError, tmpRecords, fNext)=>
                {
                    return fNext();
                }
            }
            if (!pOptions) pOptions = {};
            if (!pOptions.Page)
                pOptions.Page = 0;
            if (!pOptions.AllRecords)
                pOptions.AllRecords = [];

            //console.log(`${pUrl}/${pOptions.Page}/${pSize}`);
            
            request(`${pUrl}/${pOptions.Page}/${pSize}`, pOptions, (pError, pResponse)=>
            {
                if (pError)
                    return fCallback(pError);
                
                let tmpRecords = pResponse.body;
                pOptions.AllRecords = pOptions.AllRecords.concat(tmpRecords);

                //Call invoker's iterator function
                fIterator(pError, tmpRecords, (pIterError, pIterStop)=>
                {
                    if (pIterError)
                    {
                        let tmpResults = pOptions.AllRecords;
                        delete pOptions['Page'];
                        delete pOptions['AllRecords'];
                        return fCallback(pIterError, tmpResults);
                    }
                    else if (pIterStop)
                    {
                        let tmpResults = pOptions.AllRecords;
                        delete pOptions['Page'];
                        delete pOptions['AllRecords'];
                        return fCallback(null, tmpResults);
                    }
                    else
                    {
                        if (!tmpRecords.length ||
                            tmpRecords.length < pSize)
                        {
                            let tmpResults = pOptions.AllRecords;
                            delete pOptions['Page'];
                            delete pOptions['AllRecords'];
                            return fCallback(null, tmpResults); //no more records to get
                        }
                        else
                        {
                            pOptions.Page += tmpRecords.length;
                            //recurse
                            return getAllRecordsPaged(pUrl, pOptions, pSize, fIterator, fCallback);
                        }
                    }
                });
            }, true);
        }

        /**
         * Recursively call GET until error, page runs out, or invoker cancels it.
         *
         * @method get
         */
        getAsyncRecordsPagedByDate = function(pUrl, pOptions, pSize, fIterator, fCallback)
        {
            let tmpDate = pOptions.Date || new Date().toISOString();

            request(`${pUrl}/${tmpDate}/${pSize}`, pOptions, (pError, pResponse)=>
            {
                if (pError)
                    return fCallback(pError);
                
                let tmpRecords = pResponse.body;

                //Call invoker's iterator function
                fIterator(pError, tmpRecords, (pIterError, pIterStop)=>
                {
                    if (pIterError)
                    {
                        return fCallback(pIterError);
                    }
                    else if (pIterStop)
                    {
                        return fCallback();
                    }
                    else
                    {
                        if (!tmpRecords.length ||
                            tmpRecords.length < pSize)
                        {
                            return fCallback(); //no more records to get
                        }
                        else
                        {
                            //get the date from the last record
                            pOptions.Date = tmpRecords[tmpRecords.length-1][(pOptions.DateField || 'UpdateDate')];

                            //recurse
                            return getAsyncRecordsPagedByDate(pUrl, pOptions, pSize, fIterator, fCallback);
                        }
                    }
                });
            }, true);
        }

        /**
         * HTTP DELETE API request to Headlight
         *
         * @method del
         */
        var del = function(pUrl, fCallback, pNoRetry)
        {
            return request(pUrl,
                {
                    method: 'DELETE'
                },
                fCallback,
                pNoRetry
            );
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
                jar: _CookieJar,
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
            return request(pUrl,
                {
                    method: 'POST',
                    body: pPostData
                },
                fCallback,
                pNoRetry
            );
        }

        /**
         * HTTP PUT API request to Headlight
         *
         * @method put
         */
        var put = function(pUrl, pPostData, fCallback, pNoRetry)
        {
            return request(pUrl,
                {
                    method: 'PUT',
                    body: pPostData
                },
                fCallback,
                pNoRetry
            );
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
                jar: _CookieJar,
                headers:
                {
                    'Content-Type': pContentType
                }
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
                jar: _CookieJar,
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
            if (pError)
            {
                if (pError.code == 'ECONNREFUSED' || 
                    pError.code == 'ECONNRESET' ||
                    pError.code == 'ESOCKETTIMEDOUT')
                {
                    _Log.error('[ServerConnection] ERROR ' + pError);
                    return fCallback(pError);
                }
            }
            
            if (!pResponse || !pResponse.body)
            {
                if (!pError)
                    pError = 'No response received!';
            }
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
                return fCallback(pError, pResponse);
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

        var setTimeout = function(pTimeoutSeconds)
        {
            REQUEST_TIMEOUT = pTimeoutSeconds * 1000;
        }

        var currentSession = function()
        {
            return _CurrentSession;
        }

        var setServerURL = function(pUrl)
        {
            _ServerURL = pUrl + '/1.0/';
        }

        /**
		* Container Object for our Factory Pattern
		*/
		var tmpHeadlightClient = (
		{
            login: login,
            loginWithCredentials: loginWithCredentials,
            loginWithSession: loginWithSession,
            currentSession: currentSession,
			get: get,
            del: del,
            put: put,
			getFile: getFile,
			getFileExtended: getFileExtended,
            getAsyncRecordsPagedByDate: getAsyncRecordsPagedByDate,
            getAllRecordsPaged: getAllRecordsPaged,
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
            Utils: libUtils,
            setTimeout: setTimeout,
            setServerURL : setServerURL,
			new: createNew
		});

		return tmpHeadlightClient;
	}

	return createNew();
};

module.exports = new HeadlightClient();