'use strict'
/**
 * Headlight Async client methods
 * 
 * @author Jason Hillier <jason.hillier@paviasystems.com>
 * @class HeadlightAsyncClient
 * @constructor
 */
module.exports = class HeadlightAsyncClient
{
    constructor(pFable, pHeadlightClient)
    {
        if (!pFable || typeof (pFable) !== 'object' || !pFable.log)
            throw new Exception('[HeadlightClient] constructor: Invalid fable framework object!');
        this._Fable = pFable;
        this._CommonServices = pFable;
        this._Log = pFable.log;
        this._Settings = pFable.settings;
        this._Headlight = pHeadlightClient;
    }

    /**
     * HTTP Authenticate using settings configuration to Headlight
     *
     * @method login
     */
    async login()
    {
        return new Promise((resolve, reject) =>
        {
            this._Headlight.login((pError)=>
            {
                if (pError)
                {
                    return reject(pError);
                }

                return resolve(this._Headlight._CurrentSession);
            });
        });
    }

    /**
     * HTTP GET request
     *
     * @method get
     */
    async get(pURL, pNoRetry = false)
    {
        return new Promise((resolve, reject) =>
        {
            this._Headlight.get(pURL, (pError, pResponse)=>
            {
                if (pError || !pResponse || !pResponse.body || pResponse.body.Error)
                {
                    return reject(pError || 'Request error!');
                }

                return resolve(pResponse.body);
            }, pNoRetry);
        });
    }

    /**
     * HTTP POST request
     *
     * @method post
     */
    async post(pURL, pPostData, pNoRetry = false)
    {
        return new Promise((resolve, reject) =>
        {
            this._Headlight.post(pURL, pPostData, (pError, pResponse)=>
            {
                if (pError || !pResponse || !pResponse.body || pResponse.body.Error)
                {
                    return reject(pError || 'Request error!');
                }

                return resolve(pResponse.body);
            }, pNoRetry);
        });
    }

    /**
     * HTTP PUT request
     *
     * @method put
     */
    async put(pURL, pPostData, pNoRetry = false)
    {
        return new Promise((resolve, reject) =>
        {
            this._Headlight.post(pURL, pPostData, (pError, pResponse)=>
            {
                if (pError || !pResponse || !pResponse.body || pResponse.body.Error)
                {
                    return reject(pError || 'Request error!');
                }

                return resolve(pResponse.body);
            }, pNoRetry);
        });
    }

    /**
     * Lookup a record via Meadow Filter GET
     *
     * @method lookup
     * @returns Record; Null on failure
     */
    async lookup(pFilter, pEntityType)
    {
        try
        {
            var result = await this.get(`${pEntityType}s/Lite/FilteredTo/${pFilter}/0/1`);
            if (result.length > 0)
                return result[0];
            else
                return null;
        }
        catch(ex)
        {
            this._Log.warn(ex);
            return null;
        }
    }
    
    /**
     * Lookup a record by field name via Meadow Filter GET
     *
     * @method lookupBy
     * @returns Record; Null on failure
     */
    async lookupBy(pValue, pEntityType, pEntityField = 'Name')
    {
        return await this.lookup(`FBV~${pEntityField}~EQ~${pValue}`);
    }
}
