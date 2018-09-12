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

import * as models from './models';

/**
 * 
 */
export interface UserModel {
    /**
     * 
     */
    "LoginPassword": string;
    /**
     * 
     */
    "PasswordResetKey": string;
    /**
     * 
     */
    "LastSessionID": string;
    /**
     * 
     */
    "Settings": any;
    /**
     * 
     */
    "IDUser": number;
    /**
     * 
     */
    "GUIDUser": string;
    /**
     * 
     */
    "CreateDate": Date;
    /**
     * 
     */
    "CreatingIDUser": number;
    /**
     * 
     */
    "UpdateDate": Date;
    /**
     * 
     */
    "UpdatingIDUser": number;
    /**
     * 
     */
    "Deleted": number;
    /**
     * 
     */
    "DeleteDate": Date;
    /**
     * 
     */
    "DeletingIDUser": number;
    /**
     * 
     */
    "NameFirst": string;
    /**
     * 
     */
    "NameLast": string;
    /**
     * 
     */
    "Email": string;
    /**
     * 
     */
    "LoginID": string;
    /**
     * 
     */
    "IDRole": number;
    /**
     * 
     */
    "Title": string;
    /**
     * 
     */
    "Classification": string;
    /**
     * 
     */
    "IDProjectOffice": number;
    /**
     * 
     */
    "IDCustomer": number;
    /**
     * 
     */
    "EmailPending": number;
    /**
     * 
     */
    "Phone": string;
    /**
     * 
     */
    "UIHash": string;
    /**
     * 
     */
    "Timezone": string;
    /**
     * 
     */
    "Shift": string;
    /**
     * 
     */
    "SettingsJSON": string;
    /**
     * 
     */
    "ExternalSyncDate": Date;
    /**
     * 
     */
    "LastLoginTime": Date;
}
