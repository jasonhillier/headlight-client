'use strict'
/**
 * Headlight Client base module
 * 
 * @author Jason Hillier <jason.hillier@paviasystems.com>
 * @class HeadlightClient
 * @constructor
 */
var libFS = require('fs');
var libRm = require('rimraf');
var libUUID = require('fable-uuid');
var libStream = require('stream');
var libRequest = require('request');
var tough = require('tough-cookie');
var Cookie = tough.Cookie;
const BUFFER_DIR = 'buffer/'; //prepare a buffer directory for operations that require file-on-disk
const REQUEST_TIMEOUT = 60 * 1000; //60 seconds

module.exports = class HeadlightBundle
{
    constructor(pFable, pServerURL, pUsername, pPassword)
    {
        if (!pFable || typeof(pFable) !== 'object' || !pFable.log)
            throw new Exception('[HeadlightBundleBase] constructor: Invalid fable framework object!');
        this._Fable = pFable;
        this._CommonServices = pFable;
        this._Log = pFable.log;
        this._Settings = pFable.settings;
        
        this.libEntities = require(__dirname + '/Headlight-Entities').new(pFable);
        this.libUtils = require(__dirname + '/Headlight-Utils').new(pFable);

        this._ServerURL = (pServerURL || this._Settings.Headlight.ServerURL) + '/1.0/';
        this._Username = pUsername || this._Settings.Headlight.Username;
        this._Password = pPassword || this._Settings.Headlight.Password;

        this._CookieJar = libRequest.jar();
        this._CurrentSession = null;
    }

    get Entities()
    {
        return this.libEntities;
    }

    get Utils()
    {
        return this.libUtils;
    }
    
    /**
     * Login to Headlight
     *
     * @method login
     */
    login(fCallback)
    {
        libRequest({
            method: 'POST',
            url: this._ServerURL + 'Authenticate',
            body: {UserName: this._Username, Password: this._Password},
            json: true,
            //jar: _CookieJar,
            timeout: REQUEST_TIMEOUT
            },  (pError, pResponse)=>
            {
                if (pError || !pResponse.body.UserID)
                {
                    this._Log.error('Failed to authenticate with Headlight API server!');
                    return fCallback('Failed to authenticate!');
                }

                this._Log.trace('Authenticated with Headlight API');
                //manually process cookies (ignoring domain)
                for (let i=0; i<pResponse.headers['set-cookie'].length; i++)
                {
                    //console.log('==>', pResponse.headers['set-cookie'][i]);
                    var tmpCookie = Cookie.parse(pResponse.headers['set-cookie'][i]);
                    //console.log(tmpCookie);
                    this._CookieJar.setCookie(tmpCookie, this._ServerURL);
                }
                //console.log('COOKIE DEBUG', _CookieJar._jar.store.idx);

                this._CurrentSession = pResponse.body;
                
                return fCallback();
            }
        );
    }

    loginWithCredentials(pCredentials, fCallback)
    {
        this._Username = pCredentials.Username;
        this._Password = pCredentials.Password;

        return this.login(fCallback);
    }

    loginWithSession(pSessionToken, fCallback)
    {
        //console.log(pSessionToken);

        this._CookieJar.setCookie(libRequest.cookie(`UserSession=${pSessionToken}`), this._ServerURL);

        libRequest({
            method: 'GET',
            url: this._ServerURL + '/CheckSession',
            json: true,
            jar: this._CookieJar,
            timeout: REQUEST_TIMEOUT
            },  (pError, pResponse)=>
            {
                if (pError || !pResponse.body.UserID)
                {
                    this._Log.error('Failed to authenticate with Headlight API server!');
                    return fCallback('Failed to authenticate!');
                }

                this._Log.trace('Authenticated with Headlight API');
                this._CurrentSession = pResponse.body;
                
                return fCallback(null, pResponse.body);
            });
    }

    /**
     * HTTP GET API request to Headlight
     *
     * @method get
     */
    get(pUrl, fCallback, pNoRetry)
    {
        return this.request(pUrl, {}, fCallback, pNoRetry);
    }

    /**
     * HTTP request to Headlight
     *
     * @method request
     */
    request(pUrl, pOptions, fCallback, pNoRetry)
    {
        if (!pOptions) pOptions = {};

        libRequest({
            method: pOptions.method ? pOptions.method : 'GET',
            url: this._ServerURL + pUrl,
            json: true,
            jar: this._CookieJar,
            body: pOptions.body ? pOptions.body : null,
            timeout: REQUEST_TIMEOUT
            },  (err, pResponse)=>
            {
                this.handleHeadlightResponse(err, pResponse, pNoRetry, ()=>
                {
                    return this.request(pUrl, pOptions, fCallback, true);
                },
                fCallback);
            });
    }

    /**
     * Recursively call GET until error, page runs out, or invoker cancels it.
     *
     * @method get
     */
    getAllRecordsPaged(pUrl, pOptions, pSize, fIterator, fCallback)
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
        
        this.request(`${pUrl}/${pOptions.Page}/${pSize}`, pOptions, (pError, pResponse)=>
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
                        return this.getAllRecordsPaged(pUrl, pOptions, pSize, fIterator, fCallback);
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
    getAsyncRecordsPagedByDate(pUrl, pOptions, pSize, fIterator, fCallback)
    {
        let tmpDate = pOptions.Date || new Date().toISOString();

        this.request(`${pUrl}/${tmpDate}/${pSize}`, pOptions, (pError, pResponse)=>
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
                        return this.getAsyncRecordsPagedByDate(pUrl, pOptions, pSize, fIterator, fCallback);
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
    del(pUrl, fCallback, pNoRetry)
    {
        return this.request(pUrl,
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
    getFile(pUrl, fCallback)
    {
        return this.getFileExtended(pUrl, {method: 'GET'}, fCallback);
    }

    /**
     * HTTP GET advanced file download request to Headlight
     *
     * @method getFileExtended
     */
    getFileExtended(pUrl, pOptions, fCallback)
    {
        var tmpBufferFile = this.generateBufferFileName();
        var tmpErr;
        var tmpResponse;

        this._Log.trace('Downloading file from Headlight', {Action: 'Download', URL: pUrl, params: pOptions.body});

        libRequest({
            method: pOptions.method,
            url: this._ServerURL + pUrl,
            gzip: true,
            jar: this._CookieJar,
            json: (pOptions.body),
            body: pOptions.body ? pOptions.body : null,
            timeout: pOptions.timeout ? pOptions.timeout : REQUEST_TIMEOUT
            }, (err, pResponse)=>
            {
                tmpErr = err;
                tmpResponse = pResponse;
            })
            .once('error', (err)=>
            {
                return fCallback(err);
            })
            .pipe(libFS.createWriteStream(tmpBufferFile))
            .once('close', ()=>
            {
                return fCallback(tmpErr, tmpResponse, tmpBufferFile);
            });
    }

    /**
     * HTTP POST API request to Headlight
     *
     * @method post
     */
    post(pUrl, pPostData, fCallback, pNoRetry)
    {
        return this.request(pUrl,
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
    put(pUrl, pPostData, fCallback, pNoRetry)
    {
        return this.request(pUrl,
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
    uploadFile(pFileName, pContentType, pFileStream, fCallback)
    {
        return this.uploadFileExtended(pFileName, {}, pContentType, pFileStream, fCallback);
    }

    /**
     * Save stream to Artifact endpoint
     *
     * @method uploadArtifact
     */
    uploadArtifact(pIDArtfact, pVersion, pContentType, pFileStream, fCallback)
    {
        var tmpFileName = pVersion;

        return this.uploadFileExtended(tmpFileName, {url: `Artifact/Media/${pIDArtfact}/`}, pContentType, pFileStream, fCallback);
    }

    /**
     * Save stream to RemoteFS
     *
     * @method uploadFile
     */
    uploadFileExtended(pFileName, pOptions, pContentType, pFileStream, fCallback)
    {
        var tmpUrl = 'Media/';
        if (pOptions.url)
            tmpUrl = pOptions.url;
        
        var tmpRequest = libRequest({
            method: 'POST',
            url: `${this._ServerURL}${tmpUrl}${pFileName}`,
            timeout: pOptions.timeout ? pOptions.timeout : REQUEST_TIMEOUT,
            jar: this._CookieJar,
            headers:
            {
                'Content-Type': pContentType
            }
        });

        pFileStream.pipe(tmpRequest);

        tmpRequest.once('error', (pError)=>
        {
            this._Log.error('[RemoteFS] ERROR Saving file to grid', pError);

            return fCallback(pError);
        });

        tmpRequest.once('response', (pResponse)=>
        {
            this._Log.trace('[RemoteFS] Saved file to grid', pFileName);

            return fCallback(null, pResponse);
        });
    }

    /**
     * Download file from RemoteFS
     *
     * @method downloadFile
     */
    downloadFile(pFileName, fCallback)
    {
        return this.downloadFileExtended(pFileName, {}, fCallback);
    }

    /**
     * Download file from RemoteFS
     *
     * @method downloadFile
     */
    downloadArtifact(pIDArtifact, pVersion, fCallback)
    {
        var tmpFileName = pVersion;

        return this.downloadFileExtended(tmpFileName, {url: `Artifact/Media/${pIDArtifact}/`}, fCallback);
    }

    /**
     * Download file from RemoteFS
     *
     * @method downloadFileExtended
     */
    downloadFileExtended(pFileName, pOptions, fCallback)
    {
        var tmpUrl = 'Media/';
        if (pOptions.url)
            tmpUrl = pOptions.url;
        
        // Check if the file is already there -- and overwrite if necessary.
        this._Log.trace('Looking up file in RemoteFS', pFileName);

        var tmpResponseObject = libRequest({
            method: 'GET',
            url: `${this._ServerURL}${tmpUrl}${pFileName}`,
            json: false, //file download
            jar: this._CookieJar,
            timeout: pOptions.timeout ? pOptions.timeout : REQUEST_TIMEOUT,
            encoding: null
        }, (pError, pResponse, pBody)=>
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
            tmpOutStream.destroy = ()=> {}; //this isn't implemented on base/default Readable type

            var tmpContentType = pResponse.headers['content-type'];
            return fCallback(null, {name: pFileName, contentType: tmpContentType}, tmpOutStream);
        });
    }

    /**
     * Check if file exists in RemoteFS
     *
     * @method checkIfFileExists
     */
    checkIfFileExists(pFileName, fCallback)
    {
        // Check if the file is already there
        this.get('Media/Count/' + pFileName, (err, pResponse)=>
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
    handleHeadlightResponse(pError, pResponse, pNoRetry, fRetry, fCallback)
    {
        if (!pResponse || !pResponse.body)
        {
            if (!pError)
                pError = 'No response received!';
        }
        if (!pNoRetry &&
            (pError || pResponse.body.Error)) //TODO: check status code
        {
            this._Log.warn('Headlight API error. Attempting to re-authenticate...', {Error: pError || pResponse.body.Error});

            this.login((err, response)=>
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
    generateBufferFileName()
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
            this._Log.warn('Trouble accessing directory: ' + BUFFER_DIR);
        }

        return BUFFER_DIR + libUUID.getUUID();
    }

    setTimeout(pTimeoutSeconds)
    {
        REQUEST_TIMEOUT = pTimeoutSeconds * 1000;
    }

    currentSession()
    {
        return this._CurrentSession;
    }
};
