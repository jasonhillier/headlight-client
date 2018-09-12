import * as API from './api';
export { API };

export interface GeneralAPI
{
    setDefaultAuthentication(pAuth: API.Authentication);
}

export class CookieAuth implements API.Authentication {
    constructor(private sessionId: string){
    }

    applyToRequest(requestOptions: any): void {
        requestOptions.headers['Cookie'] = 'UserSession=' + this.sessionId;
    }
}

export class Client
{
    private _BaseURL: string;
    private _Cookie: CookieAuth;
    private _Auth: API.AuthenticateApi;
    //private _ApiReferences: {[key: string]: 

    constructor(pBaseURL: string)
    {
        this._BaseURL = pBaseURL;

        this._Auth = new API.AuthenticateApi(pBaseURL);
    }

    public async Login(pUsername: string, pPassword: string): Promise<any>
    {
        var result = await this._Auth.authenticate({UserName: pUsername, Password: pPassword});
        this._Cookie = new CookieAuth(result.body.SessionID);

        return result.body;
    }

    public API<T extends GeneralAPI>(pApiType: new(baseURL: string)=>T): T
    {
        var apiObject = new pApiType(this._BaseURL);
        apiObject.setDefaultAuthentication(this._Cookie);

        return apiObject;
    }
}
