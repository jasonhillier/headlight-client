/**
 * HeadlightAPI
 * Pavia Headlight API Server
 *
 * OpenAPI spec version: 0.0.12
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

import * as models from '../model/models';

/* tslint:disable:no-unused-variable member-ordering */

export class ObservationsFilterApi {
    protected basePath = 'https://localhost/1.0';
    public defaultHeaders : any = {};

    static $inject: string[] = ['$http', '$httpParamSerializer', 'basePath'];

    constructor(protected $http: ng.IHttpService, protected $httpParamSerializer?: (d: any) => any, basePath?: string) {
        if (basePath !== undefined) {
            this.basePath = basePath;
        }
    }

    /**
     * Search Observations using search index (solr)
     * @param body 
     * @param Begin Beginning (skip) number of records (to page)
     * @param Cap Maximum number of records to return
     */
    public getObservationsFilter (body: models.ObservationFilterRequest, Begin: number, Cap: number, extraHttpRequestParams?: any ) : ng.IHttpPromise<{}> {
        const localVarPath = this.basePath + '/ObservationsFilter/{Begin}/{Cap}'
            .replace('{' + 'Begin' + '}', encodeURIComponent(String(Begin)))
            .replace('{' + 'Cap' + '}', encodeURIComponent(String(Cap)));

        let queryParameters: any = {};
        let headerParams: any = (<any>Object).assign({}, this.defaultHeaders);
        // verify required parameter 'body' is not null or undefined
        if (body === null || body === undefined) {
            throw new Error('Required parameter body was null or undefined when calling getObservationsFilter.');
        }

        // verify required parameter 'Begin' is not null or undefined
        if (Begin === null || Begin === undefined) {
            throw new Error('Required parameter Begin was null or undefined when calling getObservationsFilter.');
        }

        // verify required parameter 'Cap' is not null or undefined
        if (Cap === null || Cap === undefined) {
            throw new Error('Required parameter Cap was null or undefined when calling getObservationsFilter.');
        }

        let httpRequestParams: ng.IRequestConfig = {
            method: 'POST',
            url: localVarPath,
            data: body,
            params: queryParameters,
            headers: headerParams
        };

        if (extraHttpRequestParams) {
            httpRequestParams = (<any>Object).assign(httpRequestParams, extraHttpRequestParams);
        }

        return this.$http(httpRequestParams);
    }
    /**
     * Search Observations using search index (solr)
     * @param body 
     */
    public getObservationsFilterCount (body: models.ObservationFilterRequest, extraHttpRequestParams?: any ) : ng.IHttpPromise<{}> {
        const localVarPath = this.basePath + '/ObservationsFilter/Count';

        let queryParameters: any = {};
        let headerParams: any = (<any>Object).assign({}, this.defaultHeaders);
        // verify required parameter 'body' is not null or undefined
        if (body === null || body === undefined) {
            throw new Error('Required parameter body was null or undefined when calling getObservationsFilterCount.');
        }

        let httpRequestParams: ng.IRequestConfig = {
            method: 'POST',
            url: localVarPath,
            data: body,
            params: queryParameters,
            headers: headerParams
        };

        if (extraHttpRequestParams) {
            httpRequestParams = (<any>Object).assign(httpRequestParams, extraHttpRequestParams);
        }

        return this.$http(httpRequestParams);
    }
}
