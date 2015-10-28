# clubIslive api documentation

This is a quick reference, for the full documentation go to [workingonit](workingonit)

## notes

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
  * **checkUsername** (string username, function callback)
  * **register** (object form, function callback)
  * **login** ([*string role*], string username, string password, function callback)
  * **update** (object form, function callback)
  * **forgotPassword** ([*string role*], string username, string email, function callback)

* schedule
  * **fetch** (string username, function callback)
