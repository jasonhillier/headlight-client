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
    private _ApiReferences: Map<string, GeneralAPI>;

    constructor(pBaseURL: string)
    {
        this._BaseURL = pBaseURL;
        this._ApiReferences = new Map<string, GeneralAPI>();

        this._Auth = new API.AuthenticateApi(pBaseURL);
    }

    /**
     * Perform login operation, and keep session cookie for use in later API calls.
     */
    public async Login(pUsername: string, pPassword: string): Promise<any>
    {
        var result = await this._Auth.authenticate({UserName: pUsername, Password: pPassword});
        this._Cookie = new CookieAuth(result.body.SessionID);

        return result.body;
    }

    /**
     * Get reference to an API, and configure it according to current state of client.
     */
    public API<T extends GeneralAPI>(pApiType: new(baseURL: string)=>T): T
    {
        let apiObject = this._ApiReferences[pApiType.name];
        if (!apiObject)
            apiObject = new pApiType(this._BaseURL);

        this._ApiReferences[pApiType.name] = apiObject;
        
        apiObject.setDefaultAuthentication(this._Cookie);

        return <T>apiObject;
    }
}
