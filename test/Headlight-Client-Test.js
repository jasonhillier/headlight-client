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
        ServerURL: '${DEV_SERVER|https://headlightqa.paviasystems.com}',
        Username: '${DEV_USER|jason}',
        Password: '${DEV_PASSWORD|pegasus}'
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
				_HeadlightClient = new (require('../source/Headlight-Client'))(_Fable);
				
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
			'should be able to create an Observation',
			function(fComplete)
			{
				var tmpObservation = _HeadlightClient.Entities.createFromPrototype('Observation-Image');
				tmpObservation.DesignatedTime = new Date();
				tmpObservation.Name = 'New Test Image Observation';
				tmpObservation.IDProject = 1;

				_HeadlightClient.post('Observation', tmpObservation, function(pError, pResponse)
				{
                    if (!pError)
                    {
                        Expect(pResponse.body).to.have.property('IDObservation');
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
			'test custom request timeout for getFile',
			function(fComplete)
			{
				//set timeout to an unreasonably low number, so that it will always timeout
				_HeadlightClient.getFileExtended('Media/Sample_1', {timeout: 1}, function(pError, pResponse, pBufferFile)
                {
                    Expect(`${pError}`).to.equal('Error: ETIMEDOUT', 'Expected timeout error did not occur');

                    return fComplete();
                });
			}
		);

		test
		(
			'should be able to upload artifact to remote server',
			function(fComplete)
			{
                var tmpFileStream = fs.createReadStream(__dirname + '/sample.jpeg');

				_HeadlightClient.uploadArtifact(1, 1, 'image/jpeg', tmpFileStream, function(pError, pResponse)
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
			'should be able to download artifact from remote server',
			function(fComplete)
			{
				_HeadlightClient.downloadArtifact(1, 1, function(pError, pFileInfo, pFileStream)
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
			'should be able to page through some Observations by date',
			function(fComplete)
			{
				_HeadlightClient.getAsyncRecordsPagedByDate('/ObservationsByUpdateDate', {}, 10, function(pError, pRecords, fCallback)
                {
					Expect(pRecords.length).to.equal(10, 'Should have found 10 observations!');
					//console.log(pRecords[pRecords.length-1]);

					return fCallback(null, true); //tell it to stop after first iteration
                }, fComplete);
			}
		);
    }
);