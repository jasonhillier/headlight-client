/**
* Unit tests for HeadlightEntities
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
	ProductVersion: '0.0.1'
});

var _Fable = require('fable').new(_MockSettings);

suite
(
	'Object Sanity',
	function()
	{
		var _HeadlightEntities = null;

		test
		(
			'initialize should build a happy little object',
			function()
			{
				_HeadlightEntities = require('../source/Headlight-Entities').new(_Fable);
				
				Expect(_HeadlightEntities)
					.to.be.an('object', 'PaviaUtility should initialize as an object directly from the require statement.');
			}
		);

        test
		(
			'create new object from prototype',
			function()
			{
                var tmpObject = _HeadlightEntities.createFromPrototype('Observation-Image');
				Expect(tmpObject)
                    .to.be.an('object', 'Failed to create new Observation object!');
			}
		);
    }
);