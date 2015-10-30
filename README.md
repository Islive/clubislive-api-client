# clubIslive api documentation

This is a quick reference, for the full documentation go to [API for clubislive](https://apidocs.clubislive.nl/)

## notes

## properties
These can be set during initialization in an options object, or afterwards

* string url
  * Url of api*(when using sails.io this will have no effect after initialization)*
* string apiKey
  * The api key that has been assigned to you, this will be supplied on each request
* object io
  * A sails.io instance (Has to be initialized before supplying it)
* string language
  * 2 character country code for the preferred language
* bool testMode
  * During testMode, data will not be changed
* string token
  * A login token, which will be sent on every request if supplied

### callbacks

Callbacks always have 2 arguments; **error** and **result**.

If any error is encounterd, **error** will be set

**result** will always be the response you get from the server unless the request could not be made in which case there is no response.

## exposed functions

* *global*
  * **formValues** (formelement formElement)
  * **convertObjectToForm** (formelement formElement, object object)

* performer
  * **checkUsername** (string username, function callback)
  * **register** (object form, function callback)
  * **login** (string username, string password, function callback)
  * **search** (object searchparams, function callback)
  * **searchByUsername** (string username, function callback)
  * **update** (object form, function callback)
  * **forgotPassword** (string username, string email, function callback)

* user
  * **register** (object form, function callback)
  * **fetchOwn** (object params, function callback)
  * **checkUsername** (string username, function callback)
  * **register** (object form, function callback)
  * **login** ([*string role*], string username, string password, function callback)
  * **update** (object form, function callback)
  * **forgotPassword** ([*string role*], string username, string email, function callback)

* schedule
  * **fetch** (string username, function callback)

* message
  * **fetch** (string username, object params, function callback)
