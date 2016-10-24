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

        test
		(
			'should be able to upload media to remote server',
			function(fComplete)
			{
                var tmpFileStream = fs.createReadStream(__dirname + '/sample.jpeg');

				_HeadlightClient.uploadFile('Sample_1', 'image/jpeg', tmpFileStream, function(pError, pResponse)
                {
                    if (!pError)
                    {
                        Expect(pResponse.statusCode).to.equal(200, 'File upload HTTP error!');
                    }

                    return fComplete(pError);
                });
			}
		);

        test
		(
			'should be able to download media from remote server',
			function(fComplete)
			{
				_HeadlightClient.downloadFile('Sample_1', function(pError, pFileInfo, pFileStream)
                {
                    if (!pError)
                    {
                        Expect(pFileInfo.contentType).to.equal('image/jpeg', 'File download type does not match what was uploaded!');
                    }

                    return fComplete(pError);
                });
			}
		);

        test
		(
			'should be able to check if any files exist matching search criteria on remote server',
			function(fComplete)
			{
				_HeadlightClient.checkIfFileExists('Sample_1', function(pError, pExists)
                {
                    if (!pError)
                    {
                        Expect(pExists).to.equal(true, 'File should exist!');
                    }

                    return fComplete(pError);
                });
			}
		);
    }
);