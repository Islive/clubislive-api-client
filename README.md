# clubIslive api documentation

This is a quick reference, for the full documentation go to [API for clubislive](https://apidocs.clubislive.nl/)

## notes

### properties
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
  * **search** ([*object searchparams*], [*number page*], function callback)
  * **searchByUsername** (string username, [*object options*], function callback)
  * **update** (object form, function callback)

* customer
  * **register** (object form, function callback)
  * **login** (string username, string password, function callback)
  * **fetchOwn** (object params, function callback)
  * **update** (object form, function callback)
  * **tip** (number userId, number amount, function callback)
  * **remove** (function callback)

* user
  * **checkUsername** (string username, function callback)
  * **login** ([*string role*], string username, string password, function callback)
  * **loginByHash** (string hash, function callback)
  * **forgotPassword** ([*string username*], [*string email*], function callback)
  * **resetPassword** (string hash, string password, function callback)
  * **verifyEmail** (string hash, function callback)
  * **resendValidationMail** (function callback)

* agenda
  * **fetchSchedule** (string username, function callback)

* news
  * **fetch** (function callback)

* message
  * **fetchByUsername** (string username, object params, function callback)
  * **inbox** ([*number page*], function callback)
  * **compose** (string to, string title, string content, function callback)
  * **reply** (string to, string hash, string content, function callback)
  * **markRead** (string hash, [*number messsageId*], function callback)

* follow
  * **isFollowing** (number userId, function callback)
  * **fetchAll** (function callback)
  * **fetchFollowers** (function callback)
  * **follow** (number userId, function callback)
  * **unfollow** (number userId, function callback)

* payment
  * **getAssortiment** (string assortimentName, [*object extraParameters*], function callback)
  * **createSession** (object paymentData, function callback)
  * **getRedeemInfo** (number bundleId, function callback)
  * **redeemCode** (number bundleId, string code, [*object options*], function callback)

* media
  * **create** (object mediaInfo, function callback)
  * **update** (object mediaInfo, function callback)
  * **fetchOwn** (function callback)
  * **fetchBought** (function callback)
  * **fetchByFollowers** (number userId, [*number limit*], function callback)
  * **fetchAll** (string type, [*string gender*], [*number page*], function callback)
  * **fetchByUsername** (string username, function callback)
  * **fetchAlbum** (string username, number albumId, function callback)
  * **checkAccess** (number mediaId, function callback)
  * **remove** (number mediaId, function callback)
  * **search** ([*object filters*], function callback)

* activity
  * **load** ([*number userId*], [*object options*], function callback)
  * **loadFollowed** ([*object options*], function callback)

* chat
  * **setVIP** (string status, number userId, function callback)
  * **setFreechat** (string status, function callback)
  * **start** ([*string username*], function callback)
  * **keepAlive** ([*number userId*], function callback)
  * **kick** (string username, function callback)
  * **end** ([*string username*], function callback)
