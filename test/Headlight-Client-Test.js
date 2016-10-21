/**
* Unit tests for HeadlightClient
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
        ServerURL: 'https://headlightstg.paviasystems.com',
        Username: 'test',
        Password: 'test'
    }
});

var _Fable = require('fable').new(_MockSettings);

suite
(
	'Object Sanity',
	function()
	{
		var _HeadlightClient = null;

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
			'should be able to login to Headlight',
			function(fComplete)
			{
				_HeadlightClient.login(function(pError)
                {
                    return fComplete(pError);
                });
			}
		);

        test
		(
			'should be able to get the Observation Manifest',
			function(fComplete)
			{
				_HeadlightClient.get('ObservationManifests', function(pError, pResponse)
                {
                    if (!pError)
                    {
                        Expect(pResponse.body).to.be.a('array', 'Invalid Observation Manifest!');
                    }

                    return fComplete(pError);
                });
			}
		);
    }
);