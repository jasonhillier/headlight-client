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
        ServerURL: 'http://localhost:8080',
        Username: 'jason',
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
				_HeadlightClient = new (require('../source/Headlight-Client'))(_Fable);
				
				Expect(_HeadlightClient)
					.to.be.an('object', 'PaviaUtility should initialize as an object directly from the require statement.');
			}
		);

        test
		(
			'should be able to login to Headlight',
			async function(fComplete)
			{
                await _HeadlightClient.Async.login();
                return fComplete();
			}
		);

        test
		(
			'should be able to get the Observation Manifest',
			async function(fComplete)
			{
                var result = await _HeadlightClient.Async.get('ObservationManifests');
                Expect(result).to.be.a('array', 'Invalid Observation Manifest!');
                return fComplete();
			}
		);

		test
		(
			'should be able to create an Observation',
			async function(fComplete)
			{
				var tmpObservation = _HeadlightClient.Entities.createFromPrototype('Observation-Image');
				tmpObservation.DesignatedTime = new Date();
				tmpObservation.Name = 'New Test Image Observation';
				tmpObservation.IDProject = 1;

                var result = await _HeadlightClient.Async.post('Observation', tmpObservation);
                Expect(result).to.have.property('IDObservation');
                return fComplete();
			}
        );
    }
);
