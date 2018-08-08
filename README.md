# clubIslive api documentation

This is a quick reference, for the full documentation go to [API for clubislive](https://apidocs.clubislive.nl/)

## notes

### debug
 * Request Timers
   * start: `localStorage.setItem('api-log-times',1)` in the browser console to activate timers.
   * stop: `localStorage.removeItem('api-log-times')` in the browser console to deactivate timers.

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
  * **convertObjectToForm** (formelement formElement, object object)
  * **formValues** (formelement formElement)

* abuse
  * **report** (number suspectUserId, [*string section*], [*number identifier*], string reason, function callback)

* activity
  * **daily** ([*object options*], function callback)
  * **history** (string event, [*object options*], function callback)
  * **load** ([*number userId*], [*object options*], function callback)
  * **loadFollowed** ([*object options*], function callback)
  * **loadUser** (number userId | string username, [*number page*], function callback)

* agenda
  * **fetchSchedule** (string username | string date, function callback)

* chat
  * **end** ([*string username*], function callback)
  * **keepAlive** ([*number userId*], function callback)
  * **kick** (string username, function callback)
  * **latestEarnings** (function callback)
  * **setCyberToy** (string type, string status, function callback)
  * **setFreechat** (string status, function callback)
  * **setVIP** (string status, number userId, function callback)
  * **start** ([*string username*], function callback)

* conversation
  * **archive** (number userId, function callback)
  * **fetch** (number userId, [*number page*], [*object params*], function callback)
  * **fetchAll** ([*number page*], [*number limit*], function callback)
  * **fetchUnread** (function callback)
  * **markAsRead** (number userId, function callback)
  * **send** (number userId, string message, [*binaryString attachment*], function callback)

* customer
  * **fetchOwn** (function callback)
  * **login** (string username, string password, function callback)
  * **register** (object form, function callback)
  * **remove** (function callback)
  * **tip** (number userId, number amount, [*object options*], function callback)
  * **update** (object form, function callback)
  * **upload** (string type, string image, function callback)

* follow
  * **fetchAll** (function callback)
  * **fetchAllFollowed** ([*number userId*], [*number page*], [*object options*], function callback)
  * **fetchAllFollowers** ([*number userId*], [*number page*], [*object options*], function callback) **Note:** *if you want to omit **userId** but use **page**, supply **null** as **userId***
  * **follow** (number userId, function callback)
  * **isFollowing** (number userId, function callback)
  * **unfollow** (number userId, function callback)

* global
  * **search** (string query, [*object options*], function callback)

* hotornot
  * **fetch** ([*object options*], function callback)
  * **topPosts** ([*object options*], function callback)
  * **topUsers** ([*object options*], function callback)
  * **upload** (binaryString attachment, function callback)

* media
  * **buy** (number mediaId, function callback)
  * **checkAccess** (number mediaId, function callback)
  * **create** (object mediaInfo, function callback)
  * **fetchAlbum** (string username, number albumId, function callback)
  * **fetchAll** (string type, [*string gender*], [*number page*], function callback)
  * **fetchBought** (function callback)
  * **fetchByFollowers** (number userId, [*number limit*], function callback)
  * **fetchByUsername** (string username, function callback)
  * **fetchOwn** (function callback)
  * **fetchOwnRating** (number mediaId, function callback)
  * **moderate** (function callback)
  * **pending** (function callback)
  * **rate** (number mediaId, number score, function callback)
  * **remove** (number mediaId, function callback)
  * **search** ([*object filters*], function callback)
  * **update** (object mediaInfo, function callback)
  * **viewAlbum** (number albumId, function callback)
  * **viewAttachments** (string username, function callback)

* message
  * **compose** (string to, string title, string content, function callback)
  * **fetchByUsername** (string username, object params, function callback)
  * **inbox** ([*number page*], function callback)
  * **markRead** (string hash, [*number messsageId*], function callback)
  * **reply** (string to, string hash, string content, function callback)

* news
  * **fetch** (function callback)

* payment
  * **createSession** (object paymentData, function callback)
  * **getAssortiment** (string assortimentName, [*object extraParameters*], function callback)
  * **getRedeemInfo** (number bundleId, function callback)
  * **redeemCode** (number bundleId, string code, [*object options*], function callback)

* performer
  * **checkUsername** (string username, function callback)
  * **login** (string username, string password, function callback)
  * **register** (object form, function callback)
  * **search** ([*object searchparams*], [*number page*], function callback)
  * **searchByUsername** (string username, [*object options*], function callback)
  * **update** (object form, function callback)

* post
  * **all** ([*object options*], function callback)
  * **compose** (string body, [*binaryString attachment*], function callback)
  * **delete** (number postId, function callback)
  * **fetch** ([*number userId*], [*object options*], function callback)
  * **fetchLikers** (string section, number identifier, [*object options*], function callback)
  * **fetchReplies** (number postId, [*number lowerThanPostId*], [*object options*], function callback)
  * **fetchSelection** (number postId | array postIds, [*object options*], function callback)
  * **fetchSuggested** ([*object options*], function callback)
  * **pin** (number postId, [*bool onNewsPage*], function callback)
  * **rate** (number postId, number score, function callback)
  * **reply** (number postId, string body, [*binaryString attachment*], function callback)
  * **unpin** (number postId, [*bool onNewsPage*], function callback)

* rules
  * **promotion** (function callback)

* shop
  * **buy** (number mediaId, number receiverId, string message, function callback)
  * **fetch** (number mediaId, function callback)

* user
  * **autocomplete** (string query, function callback)
  * **birthdays** ([*object options*], function callback)
  * **checkEmail** (string email, function callback)
  * **checkUsername** (string username, function callback)
  * **fetchOwn** (function callback)
  * **findByUsername** (string username, function callback)
  * **forgotPassword** ([*string username*], [*string email*], function callback)
  * **login** ([*string role*], string username, string password, function callback)
  * **loginByHash** (string hash, function callback)
  * **online** (function callback)
  * **matches** (function callback)
  * **register** (object form, function callback)
  * **remove** (function callback)
  * **removeProfileCover** (function callback)
  * **resendValidationMail** (function callback)
  * **resetPassword** (string hash, string password, function callback)
  * **setProfileCover** (binaryString attachment, function callback)
  * **suggestedFuddies** ([*object options*], function callback)
  * **tip** (number userId, number amount, [*object options*], function callback)
  * **update** (object form, function callback)
  * **uploadSnapshot** (string snapshot, [*string type*], [*object options*], function callback)
  * **verifyEmail** (string hash, function callback)
