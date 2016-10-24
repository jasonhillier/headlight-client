/**
 * Headlight Entities base module
 * 
 * @author Jason Hillier <jason.hillier@paviasystems.com>
 * @class HeadlightEntities
 * TODO: Eventually this should provide basic CRUD for each the various meadow endpoints in Headlight
 * @constructor
 */

var HeadlightEntities = function()
{
    function createNew(pFable)
    {
        // If a valid fable object isn't passed in, return a constructor
		if ((typeof(pFable) !== 'object') || (!pFable.hasOwnProperty('fable')))
			return {new: createNew};
		var _Log = pFable.log;
		var _Settings = pFable.settings;

        /**
		* Container Object for our Factory Pattern
		*/
        var createFromPrototype = function(pEntityName, fCallback)
        {
            var tmpEntityPath = pEntityName;

            if (pEntityName.indexOf('/') < 0)
                tmpEntityPath = `${__dirname}/templates/${pEntityName.toLowerCase()}-prototype`;
            
            try
            {
                var tmpPrototype = require(tmpEntityPath);
            } catch(ex)
            {
                _Log.error('Failed to create object from prototype JSON!', ex.message);
                return null;
            }

            return JSON.parse(JSON.stringify(tmpPrototype));
        }

        /**
		* Container Object for our Factory Pattern
		*/
		var tmpHeadlightEntities = (
		{
            createFromPrototype: createFromPrototype,
			new: createNew
		});

		return tmpHeadlightEntities;
	}

	return createNew();
};

module.exports = new HeadlightEntities();
