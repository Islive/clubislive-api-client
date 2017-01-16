(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals

    root.clubisliveApiClient = factory();
  }
}(this, function () {
  var GENERATE_GET                      = 'GENERATE_GET',
      GENERATE_GET_APPEND_PARAM1_TO_URL = 'GENERATE_GET_APPEND_PARAM1_TO_URL',
      GENERATE_POST                     = 'GENERATE_POST';

  function Api(apiKey, options) {
    // When this function is called without the new keyword, return a new copy of Api
    if (!(this instanceof Api)) {
      return new Api(apiKey, options);
    }

    // Options has to be an object
    if (!options) {
      options = {};
    }

    if (typeof options === 'string') {
      options = {
        url: options
      };
    }

    if (!options.url && !options.io) {
      options.url = 'https://api.clubislive.nl';
    }

    // We remove trailing slash
    if (options.url.substr(-1) === '/') {
      options.url = options.url.slice(0, -1);
    }

    if (options.testMode) {
      this.testMode = true;
    }

    this.token      = options.token || null;
    this.io         = options.io;
    this.url        = options.url;
    this.apiKey     = apiKey;
    this.apiVersion = '1';
    this.language   = options.language || 'en';
    this.noQueue    = options.noQueue === true;

    // If we're using sails.io, add something to add the event handlers
    if (this.io) {
      if (this.io.socket) {
        this.connected = true;
        this.io.socket.on('disconnect', function () {
          this.connected = false;
          this.handleSocketDisconnect();
        }.bind(this));
        this.io.socket.on('connected', function () {
          this.connected = true;
        }.bind(this));
        this.io.socket.on('reconnect', function () {
          this.connected = true;
        }.bind(this));
      }

      this.eventHandlers = {};

      // When a queue is used, keep in mind that requests made when the socket is disconnected will never fire a callback
      if (!this.noQueue) {
        // TODO
      }
    }

    // We use a queue when noQueue is omitted from options
    if (!this.noQueue) {
      this.concurrentCalls = options.concurrentCalls || 1;
      this.initQueue();
    }

    // Loop through all api methods
    for (var objectName in apiMethods) {
      if (typeof this[objectName] === 'undefined') {
        this[objectName] = {};
      }

      // Loop through all functions inside this api method group
      for (var methodName in apiMethods[objectName]) {
        if (typeof apiMethods[objectName][methodName] === 'string' || (typeof apiMethods[objectName][methodName] === 'object' && apiMethods[objectName][methodName] instanceof Array)) {
          // We are gonna generate a function
          this[objectName][methodName] = function(objectName, methodName) {
            var params       = Array.prototype.slice.call(arguments, 2),
                routeDetails = [];

            if (typeof apiMethods[objectName][methodName] === 'string') {
              // We need to generate the route from the objectname + methodname
              routeDetails = [apiMethods[objectName][methodName], [objectName, methodName].join('/')];
            } else if (typeof apiMethods[objectName][methodName] === 'object' && apiMethods[objectName][methodName] instanceof Array) {
              // We got supplied a route
              routeDetails = apiMethods[objectName][methodName];
            } else {
              // Not a string and not an array, so we fail
              throw new Error('Invalid route');
            }

            params.unshift(routeDetails[1]);

            if (routeDetails[0] === GENERATE_GET) {
              return Api.prototype.get.apply(this, params);
            }

            if (routeDetails[0] === GENERATE_GET_APPEND_PARAM1_TO_URL) {
              if (params[0].substr(-1) !== '/') {
                params[0] += '/';
              }
              params[0] += params[1];
              params.splice(1,1);
              return Api.prototype.get.apply(this, params);
            }

            if (routeDetails[0] === GENERATE_POST) {
              return Api.prototype.post.apply(this, params);
            }

            // No valid generate method selected
            throw new Error('No valid generate method');
          }.bind(this, objectName, methodName);
        } else {
          // It is a function, so add it
          this[objectName][methodName] = apiMethods[objectName][methodName].bind(this);
        }
      }
    }
  }

  var apiMethods = {
    global: {
      search: function (query, options, callback) {
        if (typeof options === 'function') {
          callback = options;
          options  = undefined;
        }

        options = options || {};

        options.q = query;

        return this.get('/search', options, callback);
      }
    },
    performer: {
      checkUsername   : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'performer/check-username/'],
      register        : [GENERATE_POST, 'performer'],
      login           : function (username, password, callback) {
        return this.user.login('performer', username, password, callback);
      },
      fetchOwn        : [GENERATE_GET, 'performer'],
      search          : function (searchOptions, page, callback) {
        if (!callback) {
          callback = page;
          if (typeof searchOptions === 'object') {
            page = 1;
          } else {
            page          = searchOptions;
            searchOptions = {};
          }
        }

        if (typeof searchOptions !== 'object') {
          searchOptions = {};
        }

        if (isNaN(page)) {
          page = 1;
        }

        searchOptions.page = page;

        return this.get('performer/search', searchOptions, callback);
      },
      searchByUsername: function (username, options, callback) {
        if (!callback) {
          callback = options;
          options  = {};
        }

        return this.get('performer/search/' + username, options, callback);
      },
      update          : GENERATE_POST
    },
    customer: {
      register      : [GENERATE_POST, 'customer'],
      login         : function (username, password, callback) {
        return this.user.login('user', username, password, callback);
      },
      fetchOwn      : [GENERATE_GET, 'customer'],
      update        : GENERATE_POST,
      tip           : function (userId, amount, options, callback) {
        var params = {
          amount: amount
        };

        if (!callback) {
          callback = options;
          options  = false;
        }

        if (options && options.type) {
          params.type = options.type || false;
        }

        if (options && options.name) {
          params.name = options.name || false;
        }

        return this.post('customer/tip/' + userId, params, callback);
      },
      remove        : function (callback) {
        return this.post('customer/delete', callback);
      },
      upload        : function (type, image, callback) {
        return this.post('customer/upload', {type: type, image: image}, callback);
      }
    },
    user: {
      register: [GENERATE_POST, 'user'],
      fetchOwn: [GENERATE_GET, 'user'],
      update: GENERATE_POST,
      checkUsername: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'user/check-username/'],
      checkEmail: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'user/check-email/'],
      earnings: [GENERATE_GET, 'user/earnings'],
      trackthisToken: [GENERATE_GET, 'user/trackthis-token'],
      ignore: [GENERATE_GET_APPEND_PARAM1_TO_URL, '/user/match/ignore/'],
      login: function (role, username, password, callback) {
        // Role is optional, defaults to 'user'
        if (!callback) {
          callback = password;
          password = username;
          username = role;
          role     = undefined;
        }

        return this.post('user/login', { role: role, username: username, password: password }, callback);
      },
      loginByHash: function (hash, callback) {
        return this.post('user/login/' + hash, callback);
      },
      forgotPassword: function (username, email, callback) {
        // Role is optional, defaults to 'user'
        if (!callback) {
          callback = email;
          email    = username;
          username = null;
        }

        if (typeof username === 'string' && username.indexOf('@') > -1) {
          email    = username;
          username = null;
        }

        if (typeof email === 'string' && email.indexOf('@') === -1) {
          username = email;
          email    = null;
        }

        return this.post('user/forgot-password', { username: username, email: email }, callback);
      },
      verifyEmail: function (hash, callback) {
        return this.post('user/verify-email', { hash: hash }, callback);
      },
      resetPassword: function (hash, password, callback) {
        return this.post('user/reset-password', { hash: hash, password: password }, callback);
      },
      resendValidationMail: [GENERATE_GET, 'user/resend-validate-email'],
      online: GENERATE_GET,
      matches: GENERATE_GET,
      uploadSnapshot: function (snapshot, type, params, callback) {
        if (typeof type === 'function') {
          callback = type;
          params   = null;
          type     = null;
        } else if (typeof params === 'function') {
          callback = params;

          if (typeof type === 'string') {
            params = null
          } else {
            params = type;
            type   = null;
          }
        }

        params = params || {};

        params.snapshot = snapshot;

        if (type) {
          params.type = type;
        }

        return this.post('user/snapshot', params, callback);
      },
      setProfileCover: function (attachment, callback) {
        return this.post('attachment/profile', { attachment: attachment }, callback);
      },
      removeProfileCover: function (callback) {
        return this.get('attachment/remove/profile', callback);
      },
      findByUsername: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'user/find/'],
      find          : function (searchOptions, page, callback) {
        if (!callback) {
          callback = page;
          if (typeof searchOptions === 'object') {
            page = 1;
          } else {
            page          = searchOptions;
            searchOptions = {};
          }
        }

        if (typeof searchOptions !== 'object') {
          searchOptions = {};
        }

        if (isNaN(page)) {
          page = 1;
        }

        searchOptions.page = page;

        return this.get('user/find', searchOptions, callback);
      },
      tip: function (userId, amount, options, callback) {
        var params = {
          amount: amount
        };

        if (!callback) {
          callback = options;
          options  = false;
        }

        if (options && options.type) {
          params.type = options.type || false;
        }

        if (options && options.name) {
          params.name = options.name || false;
        }

        return this.post('user/tip/' + userId, params, callback);
      },
      remove: function (callback) {
        return this.post('user/delete', callback);
      },
      autocomplete: function (query, callback) {
        return this.get('user/autocomplete', { q: query }, callback);
      }
    },
    agenda: {
      fetchSchedule: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'schedule/']
    },
    news: {
      fetch: [GENERATE_GET, 'news']
    },
    message: {
      fetchByUsername: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'message/fetch/'],
      inbox: function (page, callback) {
        if (!callback) {
          callback = page;
          page     = 1;
        }

        if (isNaN(page)) {
          page = 1;
        }

        return this.get('message/inbox', { page: page }, callback);
      },
      compose: function (to, title, content, callback) {
        return this.post('message', { to: to, message: { title: title, content: content } }, callback);
      },
      reply: function (to, hash, content, callback) {
        return this.post('message/' + hash, { to: to, message: { content: content } }, callback);
      },
      unread  : GENERATE_GET,
      markRead: function (hash, messageId, callback) {
        if (!callback) {
          callback  = messageId;
          messageId = undefined;
        }

        var url = 'message/read/' + hash;

        if (messageId) {
          url += '/' + messageId;
        }

        return this.get(url, callback);
      }
    },
    conversation: {
      markAsRead  : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'conversation/read'],

      fetchUnread : [GENERATE_GET, 'conversation/unread'],

      fetch : function (userId, page, params, callback) {
        if (typeof page === 'function') {
          callback = page;
          page     = undefined;
          params  = undefined;
        } else if (typeof params === 'function') {
          callback = params;
          if (typeof page === 'object') {
            params = page;
            page    = undefined;
          } else {
            params = undefined;
          }
        }

        page    = page || 1;
        params = params || {};

        params.page = page;

        return this.get('conversation/' + userId, params, callback);
      },

      fetchAll: function (page, limit, callback) {
        if (typeof page === 'function') {
          callback = page;
          page     = undefined;
        } else if (typeof limit === 'function') {
          callback = limit;
          limit    = undefined;
        }

        page  = page  || 1;
        limit = limit || 30;

        return this.get('conversation/all', { page : page, limit: limit }, callback);
      },

      send  : function (userId, message, attachment, callback) {
        if (typeof attachment === 'function') {
          callback = attachment;
          attachment = null;
        }

        var data = { message: message };

        if (attachment) {
          data.attachment = attachment;
        }

        return this.post('conversation/' + userId, data, callback);
      }
    },
    follow: {
      isFollowing      : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'follow/'],
      fetchAll         : [GENERATE_GET, 'follow/all'],
      fetchAllFollowers: function (userId, page, options, callback) {
        if (typeof userId === 'function') {
          callback = userId;
          userId   = null;
        } else if (typeof page === 'function') {
          callback = page;
          page     = undefined;
        } else if (typeof options === callback) {
          callback = options;
          options  = undefined;

          if (typeof page === 'object') {
            options = page;
            page    = undefined;
          }
        }

        options = options || {};

        if (page) {
          options.page = page;
        }

        if (!userId) {
          return this.get('followers', options, callback);
        }

        return this.get('followers/' + userId, options, callback);
      },
      fetchAllFollowed: function (userId, page, options, callback) {
        if (typeof userId === 'function') {
          callback = userId;
          userId   = null;
        } else if (typeof page === 'function') {
          callback = page;
          page     = undefined;
        } else if (typeof options === callback) {
          callback = options;
          options  = undefined;

          if (typeof page === 'object') {
            options = page;
            page    = undefined;
          }
        }

        options = options || {};

        if (page) {
          options.page = page;
        }

        if (!userId) {
          return this.get('follows', options, callback);
        }

        return this.get('follows/' + userId, options, callback);
      },
      follow           : function (userId, callback) {
        return this.post('follow', { userId: userId }, callback);
      },
      unfollow: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'unfollow/']
    },
    payment: {
      getAssortiment: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'payment/assortiment/'],
      createSession : function (bundleId, extraOptions, callback) {
        if (!callback) {
          callback     = extraOptions;
          extraOptions = undefined;
        }

        if (typeof extraOptions !== 'object') {
          extraOptions = {};
        }

        extraOptions.bundle = bundleId;

        return this.get('payment/start', extraOptions, callback);
      },
      getRedeemInfo: function (bundleId, callback) {
        return this.get('payment/redeem', { bundle: bundleId }, callback);
      },
      redeemCode: function (bundleId, code, options, callback) {
        if (!callback) {
          callback = options;
          options  = {};
        }

        options = options || {};

        options.bundle = bundleId;
        options.redeem = code;

        return this.post('payment/redeem', options, callback);
      }
    },
    media: {
      create          : [GENERATE_POST, 'media'],
      moderate        : GENERATE_GET,
      update          : [GENERATE_POST, 'media/update'],
      fetchOwn        : function (albumId, includeDeleted, callback) {
        if (typeof albumId === 'function') {
          callback       = albumId;
          includeDeleted = undefined;
          albumId        = undefined;
        }

        if (typeof includeDeleted === 'function') {
          callback = includeDeleted;

          if (typeof albumId === 'boolean') {
            includeDeleted = albumId;
            albumId        = undefined;
          } else {
            includeDeleted = undefined;
          }
        }

        var params = {};

        if (albumId) {
          params.albumId = albumId;
        }

        if (includeDeleted) {
          params.includeDeleted = true;
        }

        return this.get('media', params, callback);
      },
      fetchBought     : [GENERATE_GET, 'media/bought'],
      fetchByFollowers: function (userId, limit, callback) {
        if (!callback) {
          callback = limit;
          limit    = undefined;
        }

        var params = {};
        if (limit) {
          params.amount = limit;
        }

        return this.get('media/following/' + userId, params, callback);
      },
      fetchAll       : function (type, page, gender, callback) {
        if (typeof page === 'function') {
          callback = page;
          gender   = null;
          page     = 1;
        }

        if (typeof gender === 'function') {
          callback = gender;
          gender   = null;
        }

        if (isNaN(page)) {
          gender = page;
          page   = 1;
        }

        var searchOptions = { page: page };

        if (gender) {
          searchOptions.gender = gender;
        }

        return this.get('media/all/' + type, searchOptions, callback);
      },
      fetchByUsername: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'media/'],
      fetchAlbum     : function (username, albumId, callback) {
        return this.get('media/' + username + '/' + albumId, callback);
      },
      viewAlbum      : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'media/view/'],
      checkAccess    : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'media/access/'],
      remove         : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'media/remove/'],
      search         : function (filters, callback) {
        if (!callback) {
          callback = filters;
          filters  = null;
        }

        return this.get('media/search', filters, callback);
      },
      buy: function (mediaId, callback) {
        return this.post('media/buy', { media: mediaId }, callback);
      },
      rate: function (mediaId, score, callback) {
        return this.post('/media/rating/'+ mediaId, { score: score }, callback);
      },
      fetchOwnRating: [GENERATE_GET_APPEND_PARAM1_TO_URL, '/media/rating/']
    },
    shop: {
      fetch: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'shop'],
      buy: function (itemId, receiverId, message, callback) {
        if (typeof message === 'function') {
          callback = message;
          message   = null;
        }

        var data = {
          media   : itemId,
          receiver: receiverId,
          meta    : {
            message: message
          }
        };
        return this.post('media/buy', data, callback);
      }
    },
    activity: {
      news   : [GENERATE_GET, '/activities/news'],
      fetch   : [GENERATE_GET, 'activities'],
      fetchOne: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'activities'],
      load: function (userId, options, callback) {
        if (typeof userId === 'function') {
          callback = userId;
          options  = null;
          userId = undefined;
        }

        if (typeof options === 'function') {
          callback = options;
          options  = null;
        }

        if (userId && typeof userId === 'object') {
          options  = userId;
          userId = undefined;
        }

        if (!userId) {
          return this.get('activity', options, callback);
        }

        return this.get('activity/' + userId, options, callback);
      },
      loadFollowed: function (options, callback) {
        if (!callback) {
          callback = options;
          options  = null;
        }

        return this.get('activity/followed', options, callback);
      },
      loadUser: function (user, options, callback) {
        if (!callback) {
          callback = options;
          otions   = null;
        }

        return this.get('activity/all/' + user, options, callback);
      }
    },
    chat: {
      setVIP: function (status, userId, callback) {
        return this.get('chat/vip/' + status + '/' + userId, callback);
      },
      setFreechat: function (status, callback) {
        return this.get('chat/freechat/' + status, callback);
      },
      start: function (username, callback) {
        if (!callback) {
          callback = username;
          username = undefined;
        }

        if (username) {
          return this.get('chat/start/' + username, callback);
        }

        return this.get('chat/start', callback);
      },
      keepAlive: function (userId, callback) {
        if (!callback) {
          callback = userId;
          userId = undefined;
        }

        if (userId) {
          return this.get('chat/keepalive/' + userId, { skipQueue: true }, callback);
        }

        return this.get('chat/keepalive', callback);
      },
      kick: function (username, callback) {
        return this.get('chat/kick/' + username, callback);
      },
      end: function (username, callback) {
        if (!callback) {
          callback = username;
          username = undefined;
        }

        if (username) {
          return this.get('chat/end/' + username, callback);
        }

        return this.get('chat/end', callback);
      },
      latestEarnings:  [GENERATE_GET, 'chat/latest-earnings']
    },
    rules : {
      promotion: function (callback) {
        return this.get('rules/promotion', callback);
      }
    },
    post: {
      fetch: function (userId, options, callback) {
        if (typeof userId === 'function') {
          callback = userId;
          options  = undefined;
          userId   = undefined;
        } else if (typeof userId === 'object') {
          callback = options;
          options  = userId;
          userId   = undefined;
        }

        if (typeof options === 'function') {
          callback = options;
          options  = undefined;
        }

        options = options || {};

        if (!userId) {
          return this.get('posts', options, callback);
        }

        return this.get('posts/user/' + userId, options, callback);
      },
      fetchSelection: function (postIds, options, callback) {
        if (!callback) {
          callback = options;
          options  = undefined;
        }

        options = options || {};

        if (postIds instanceof Array) {
          options.postIds = postIds;

          return this.get('posts/selection', options, callback);
        }

        return this.get('post/' + postIds, options, callback);
      },
      fetchReplies: function (postId, lowerThanPostId, options, callback) {
        if (typeof lowerThanPostId === 'function') {
          callback        = lowerThanPostId;
          options         = undefined;
          lowerThanPostId = undefined;
        } else if (typeof lowerThanPostId === 'object') {
          callback        = options;
          options         = lowerThanPostId;
          lowerThanPostId = undefined;
        }

        options = options || {};

        if (lowerThanPostId) {
          options.lowestId = lowerThanPostId;
        }

        return this.get('posts/replies/' + postId, options, callback);
      },
      compose: function (body, attachment, callback) {
        if (typeof attachment === 'function') {
          callback   = attachment;
          attachment = undefined;
        }

        var postData = { body: body };

        if (attachment) {
          postData.attachment = attachment;
        }

        return this.post('post', postData, callback);
      },
      reply: function (postId, body, attachment, callback) {
        if (typeof attachment === 'function') {
          callback   = attachment;
          attachment = undefined;
        }

        var postData = { body: body };

        if (attachment) {
          postData.attachment = attachment;
        }

        return this.post('post/reply/' + postId, postData, callback);
      },
      rate: function (postId, score, callback) {
        return this.post('/post/rating/'+ postId, { score: score }, callback);
      },
      fetchLikers: function (section, identifier, options, callback) {
        if (typeof options === 'function') {
          callback = options;
          options = null;
        }

        return this.get('/rating/users/'+ section +'/' + identifier, options, callback);
      },
      delete: function (postId, callback) {
        return this.post('post/delete/' + postId, callback);
      }
    },
    abuse: {
      report: function (suspectUserId, section, identifier, reason, callback) {
        if (typeof identifier === 'function') {
          callback   = identifier;
          reason     = section;
          identifier = undefined;
          section    = undefined;
        }

        var reportData = {
          suspect: suspectUserId,
          reason : reason
        };

        if (section) {
          reportData.foreignKey = identifier;
          return this.post('abuse/report/' + section, reportData, callback);
        }

        return this.post('abuse/report', reportData, callback);
      }
    }
  };

  Api.prototype = {

    /**
     *  HQ Events
     */

    Events: {
      CUSTOMER     : 'user',
      ACTIVITY     : 'activity',
      NEWS         : 'news'
    },

    EOnlineStatus: {
      OFFLINE   : 0,
      ONLINE    : 1,
      INCHAT    : 2,
      INFREECHAT: 4,
      INVIP     : 8
    },

    Activities: {
      OFFLINE       : 'offline',
      ONLINE        : 'online',
      INCHAT        : 'inchat',
      INFREECHAT    : 'infreechat',
      INVIP         : 'invip',
      CHAT_OFF      : 'chat_off',
      BIRTHDAY      : 'birthday',
      FREECHAT      : 'freechat',
      ABUSE         : 'abuse',
      POST          : 'post',
      REPLY         : 'reply',
      MENTIONED     : 'mentioned',
      FOLLOW        : 'follow',
      MEDIA         : 'media',
      MEDIA_APPROVED: 'media_approved',
      MESSAGE       : 'message',
      RATING        : 'rating',
      PROFILE       : 'profile',
      PROFILE_COVER : 'profile_cover',
      SNAPSHOT      : 'snapshot',
      PUBLIC        : 'public'
    },

    handleSocketDisconnect: function () {
      if (this.noQueue) {
        return;
      }

      // If we get here, remove all running and queued requests and call their callback with an error

      function failRequest (data) {
        if (!(data instanceof Array)) {
          return;
        }

        data[3] = data[3] || function () {};

        data[3]('socket disconnected', null);
      }

      // First all running requests
      while (this.requestsRunning.length > 0) {
        failRequest(this.requestsRunning.shift());
      }

      // Now all queued requests
      while (this.requestQueue.length > 0) {
        failRequest(this.requestQueue.shift());
      }
    },

    on: function (eventName, func) {
      if (!this.eventHandlers) {
        // events not initialized, just return
        return;
      }

      if (eventName instanceof Array) {
        eventName.map(function (singleEventName) {
          this.on(singleEventName, func);
        });

        return;
      }

      if (typeof func !== 'function') {
        throw 'Not a valid function';
      }

      // If the event is not yet subscribed to, add it, and listen for it
      if (!this.eventHandlers[eventName]) {
        this.io.socket.on(eventName, this.trigger.bind(this, eventName));

        this.eventHandlers[eventName] = [func];
        return;
      }

      // First check if it exists
      for (var i = 0; i < this.eventHandlers[eventName].length; i++) {
        if (this.eventHandlers[eventName][i] === func) {
          return;
        }
      }

      // Add it
      this.eventHandlers[eventName].push(func);
    },

    off: function (eventName, func) {
      if (!this.eventHandlers) {
        // events not initialized, just return
        return;
      }

      if (eventName instanceof Array) {
        eventName.map(function (singleEventName) {
          this.off(singleEventName, func);
        });

        return;
      }

      if (typeof func !== 'function') {
        throw 'Not a valid function';
      }

      // event is not subscribed to
      if (!this.eventHandlers[eventName]) {
        return;
      }

      // Check if it exists
      for (var i = 0; i < this.eventHandlers[eventName].length; i++) {
        if (this.eventHandlers[eventName][i] === func) {
          this.eventHandlers.splice(i, 1);
          break;
        }
      }

      // If there are no more listeners, unsubscribe
      if (this.eventHandlers[eventName].length === 0) {
        this.socket.off(eventName);
        delete this.eventHandlers[eventName];
      }
    },

    trigger: function (eventName, data) {
      if (!this.eventHandlers) {
        // events not initialized, just return
        return;
      }

      if (eventName instanceof Array) {
        eventName.map(function (singleEventName) {
          this.trigger(singleEventName, data);
        });

        return;
      }

      // event is not subscribed to
      if (!this.eventHandlers[eventName]) {
        return;
      }

      for (var i = 0; i < this.eventHandlers[eventName].length; i++) {
        setTimeout(this.eventHandlers[eventName][i].bind(this, data), 0);
      }
    },

    /**
     *  Queue stuff
     */

    // Init the queue, overrides some functions so everything must pass through the queue
    initQueue: function () {
      this.doRequest       = this.request;
      this.request         = this.addToQueue;
      this.requestQueue    = [];
      this.requestsRunning = [];
    },

    addToQueue: function (method, url, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params   = {};
      }

      params = params || {};

      // If the socket is disconnected, just call the callback with an error since it will never happen
      if (this.io && this.io.socket && !this.connected) {
        return callback('socket disconnected', null);
      }

      var requestArray = [method, url, params, callback];

      if (params.skipQueue) {
        delete params.skipQueue;
        this.requestsRunning.push(requestArray);
        return this.doRequest(method, url, params, function (error, result) {
          this.removeFromRunningRequests(requestArray);
          setTimeout(function () {
            callback(error, result);
          }, 0);
          this.startQueue();
        }.bind(this));
      }

      this.requestQueue.push(requestArray);

      this.startQueue();
    },

    removeFromRunningRequests: function (obj) {
      for (var i = 0; i < this.requestsRunning.length; i++) {
        if (this.requestsRunning[i] == obj) {
          this.requestsRunning.splice(i,1);
          return;
        }
      }
    },

    // Start the queue async
    startQueue: function () {
      if (this.requestsRunning.length >= this.concurrentCalls || this.requestQueue.length === 0) {
        return;
      }

      setTimeout(this.processQueue.bind(this), 0);
    },

    // Process a queue item and advance to the next
    processQueue: function () {
      if (this.requestQueue.length === 0 || this.requestsRunning.length >= this.concurrentCalls) {
        return;
      }

      var currentRequest = this.requestQueue.shift();

      this.requestsRunning.push(currentRequest);

      currentRequest[3] = currentRequest[3] || function () {};

      this.doRequest.call(this, currentRequest[0], currentRequest[1], currentRequest[2], function (error, result) {
        this.removeFromRunningRequests(currentRequest);
        setTimeout(function () {
          currentRequest[3](error, result);
        }, 0);
        this.startQueue();
      }.bind(this));
    },

    client: function() {
      var xhr = new XMLHttpRequest();

      return xhr;
    },

    /**
     * Serialize the given object to an query string.
     *
     * @param   {{}} obj
     * @returns {string}
     */
    serialize: function(obj, prefix) {
      var str = [];
      for(var p in obj) {
        if (!obj.hasOwnProperty(p)) {
          continue;
        }
        var k = prefix ? prefix + '[' + p + ']' : p,
            v = obj[p];

        if (typeof v === 'object') {
          if (v === null) {
            // null values have to be kept intact
            str.push(encodeURIComponent(k) + '=null');
          } else {
            str.push(this.serialize(v, k));
          }
          continue;
        }

        if (typeof v === 'boolean') {
          // boolean's also can't be cast to a string
          str.push(encodeURIComponent(k) + '=' + v);
          continue;
        }

        str.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
      }
      return str.join('&');
    },

    ioCallback: function (response, JWR, callback) {
      if (JWR.statusCode !== 200) {
        return callback(JWR.statusCode, response);
      }
      if (!response) {
        return callback('no_response', response);
      }
      if (response.Errors) {
        return callback(response.Errors, response);
      }
      if (response.status && response.status != 200 && response.status != 'ok') {
        return callback(response.status, response);
      }

      callback(null, response);
    },

    request: function(method, url, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params   = {};
      }

      if (method !== 'GET' && method !== 'POST') {
        throw new Error('Invalid method ' + method);
      }

      if (typeof params !== 'object') {
        throw new Error('Params is not an object');
      }

      if (typeof callback !== 'function') {
        throw new Error('Callback is not an function');
      }

      params = params || {};

      if (!params.lang) {
        params.lang = this.language;
      }

      if (this.testMode && !params.testmode) {
        params.testmode = 1;
      }

      if (!params.token && this.token) {
        params.token = this.token;
      }

      // Remove skipQueue if present, because the queue is not enabled if it's still here
      if (params.skipQueue) {
        delete params.skipQueue;
      }

      // Urls have to start with a slash
      if (url.substr(0,1) !== '/') {
        url = '/' + url;
      }

      // Do we have a sails.io instance? if we do, let it handle the request and bail out;
      if (this.io && this.io.socket) {
        // If the socket is disconnected, just call the callback with an error since it will never get into the callback
        if (!this.connected) {
          return callback('scoket disconnected', null);
        }

        if (!params['x-apikey']) {
          params['x-apikey'] = this.apiKey;
        }

        if (method === 'GET') {
          this.io.socket.get(url, params, function (response, JWR) {
            return this.ioCallback(response, JWR, callback);
          }.bind(this));
        } else if (method === 'POST') {
          this.io.socket.post(url, params, function (response, JWR) {
            return this.ioCallback(response, JWR, callback);
          }.bind(this));
        } else {
          throw 'method ' + method + ' not supported';
        }
        return;
      }

      var c        = this.client(),
          paramStr = this.serialize(params);

      c.open(method, this.url + url + (method === 'GET' && paramStr.length > 0 ? '?' + paramStr : ''), true);

      c.setRequestHeader('x-apikey',  this.apiKey);
      c.setRequestHeader('x-version', this.apiVersion);

      if (method === 'POST') {
        c.setRequestHeader('Content-type', 'application/json');
      }

      c.onreadystatechange = function() {
        var response = null,
            error    = null;

        if (c.readyState !== 4) return;

        try {
          response = JSON.parse(c.responseText);
        } catch (exception) {
          response = null;
          error    = {
            error    : exception
          };
        }

        if (error != null) {
          error.status     = c.status;
          error.readyState = c.readyState;
        }

        if (error == null && c.status != 200) {
          error = c.status;
          response = response || {
            status      : c.status,
            responseText: c.responseText
          };
        }

        callback(error, response);
      };

      c.send(method === 'POST' ? JSON.stringify(params) : null);
    },

    /**
     * Convert a Form object to an nested object
     * @param {HtmlElement} formElement
     * @returns {{}}
     */
    formValues: function(formElement) {
      var fieldsets = formElement.childNodes,
          vars      = {};

      for (var i in fieldsets) {
        var fieldset   = fieldsets[i],
            fieldsetVars = {},
            inputs     = fieldset.childNodes;

        if (fieldset.tagName !== 'FIELDSET') {
          continue;
        }

        for (var i in inputs) {
          var input = inputs[i];

          if (input.tagName !== 'INPUT') {
            continue;
          }

          fieldsetVars[input.name] = input.value;
        }

        vars[fieldset.name] = fieldsetVars;
      }

      return vars;
    },

    /**
     * Do a post call
     *
     * @param {string} url
     * @param {{}}     parameters
     * @param {Function(error, result)} callback
     *
     * @returns Api
     */
    post: function(url, params, callback) {
      this.request('POST', url, params, callback);

      return this;
    },

    /**
     * Do a get call
     *
     * @param {string} url
     * @param {{}}     parameters
     * @param {Function(error, result)} callback
     *
     * @returns Api
     */
    get: function(url, params, callback) {
      this.request('GET', url, params, callback);

      return this;
    },

    /**
     * @param {HtmlElement} formElement
     * @param {{}}      object Nested object with { fieldsetName: { inputName: { placeholder: '', value: '', type: 'text' } }  }
     */
    convertObjectToForm: function(formElement, object) {
      for (var fieldsetName in object) {
        var fieldset      = object[fieldsetName],
            fieldsetElement = document.createElement('fieldset');

        fieldsetElement.name = fieldsetName;

        for (var inputName in fieldset) {
          var input = typeof fieldset[inputName] === 'object' ? fieldset[inputName] : { name : inputName, placeholder: fieldset[inputName] },
              id    = fieldsetName + '_' + inputName;

          var labelElement = document.createElement('label'),
              inputElement = document.createElement('input');

          labelElement.setAttribute('for', id);
          labelElement.textContent = input.label || input.name;

          inputElement.id          = id;
          inputElement.name        = input.name;
          inputElement.placeholder = input.placeholder || input.name;
          inputElement.type        = input.type || 'text';
          inputElement.value       = input.value || 'wawah';
          inputElement.setAttribute('required', input.required || 0);

          fieldsetElement.appendChild(labelElement);
          fieldsetElement.appendChild(inputElement);
        }

        formElement.appendChild(fieldsetElement);
      }
    }
  };

  return Api;
}));
