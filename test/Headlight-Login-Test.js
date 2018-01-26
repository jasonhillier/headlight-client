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
		
		test
		(
			'should be able to lookup a record',
			function(fComplete)
			{
				var tmp = 'CONST FLAGGING/SERV';
				_HeadlightClient.get(`Organizations/FilteredTo/FBV~Name~EQ~${encodeURIComponent(tmp)}~/0/1`, (pError, pHeadlightResult)=>
                {
					console.log(pHeadlightResult.body);

					return fComplete();
                });
			}
		);
		/*
        this.timeout(50000);

        test
		(
			'should be able to page through all records in a normal paged endpoint',
			function(fComplete)
			{
				_HeadlightClient.getAllRecordsPaged('/Projects', {}, 10, null, function(pError, pRecords)
                {
					Expect(pError).to.be.null;
					Expect(pRecords.length).to.be.greaterThan(10, 'Should have pages of projects');
					//console.log(pRecords[pRecords.length-1]);

					return fComplete();
                });
			}
		);
		*/
    }
);