/**
* Unit tests for HeadlightLogin
*
* @license     MIT
*
* @author      Jason Hillier <jason@paviasystems.com>
*/

var Chai = require("chai");
var Expect = Chai.expect;
var Assert = Chai.assert;
var fs = require('fs');

var _MockSettings = (
{
	Product: 'PaviaUtility',
	ProductVersion: '0.0.1',
    Headlight:
    {
        ServerURL: 'http://localhost:8080'
    }
});

var _Fable = require('fable').new(_MockSettings);

suite
(
	'Object Sanity',
	function()
	{
		var HeadlightLogin = null;
        var _Credentials = {};

        this.timeout(60000);

		test
		(
			'initialize should build a happy little object',
			function()
			{
				_HeadlightClient = require('../source/Headlight-Client').new(_Fable);
				
				Expect(_HeadlightClient)
					.to.be.an('object', 'PaviaUtility should initialize as an object directly from the require statement.');
			}
		);
        test
		(
			'Login Prompt',
			function(fDone)
			{
                _HeadlightClient.Utils.loginPrompt(function(pError, pCredentials)
                {
                    Expect(pCredentials.Username).to.not.be.empty;
                    Expect(pCredentials.Password).to.not.be.empty;

                    _Credentials = pCredentials;

                    return fDone();
                });
            }
        );
        test
		(
			'Login With Credentials',
			function(fDone)
			{
                _HeadlightClient.loginWithCredentials(_Credentials, function(pError)
                {
                    return fDone();
                });
            }
        );
    }
);