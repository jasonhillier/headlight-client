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


/**
 * 
 */
export interface SendToEmailRequest { 
    /**
     * 
     */
    IDDocument: number;
    /**
     * 
     */
    EmailAddressList: Array<string>;
    /**
     * 
     */
    Subject: string;
    /**
     * 
     */
    Message: string;
}