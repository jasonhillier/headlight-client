/**
 * Headlight Utils module
 * 
 * @author Jason Hillier <jason.hillier@paviasystems.com>
 * @class HeadlightUtils
 * @constructor
 */

var HeadlightUtils = function()
{
    function createNew(pFable, pServerURL, pUsername, pPassword)
    {
        // If a valid fable object isn't passed in, return a constructor
		if ((typeof(pFable) !== 'object') || (!pFable.hasOwnProperty('fable')))
			return {new: createNew};
		var _Log = pFable.log;
		var _Settings = pFable.settings;

        var libPrompt = require('prompt');

        var loginPrompt = function(fCallback)
        {
            console.log('============ Headlight Login Prompt ============');
            console.log('Server: ' + _Settings.Headlight.ServerURL);

            return libPrompt.get({
                properties:
                {
                    Username: {
                        message: 'Username'
                    },
                    Password: {
                        message: 'Password',
                        hidden: true
                    }
                }
            }, fCallback);
        }

        /**
		* Container Object for our Factory Pattern
		*/
		var tmpHeadlightUtils = (
		{
            loginPrompt: loginPrompt,
			new: createNew
		});

		return tmpHeadlightUtils;
    }

    return createNew();
}

module.exports = new HeadlightUtils();
