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
      this.eventHandlers = {};
    }

    // We use a queue when noQueue is omitted from options
    if (!this.noQueue) {
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
      searchByUsername: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'performer/search/'],
      update          : GENERATE_POST,
      forgotPassword  : function (username, email, callback) {
        return this.user.forgotPassword('performer', username, email, callback);
      }
    },
    customer: {
      register      : [GENERATE_POST, 'customer'],
      login         : function (username, password, callback) {
        return this.user.login('user', username, password, callback);
      },
      fetchOwn      : [GENERATE_GET, 'customer'],
      update        : GENERATE_POST,
      forgotPassword: function (username, email, callback) {
        return this.user.forgotPassword('user', username, email, callback);
      },
      tip           : function (userId, amount, callback) {
        return this.post('customer/tip/' + userId, { amount: amount}, callback);
      }
    },
    user: {
      checkUsername : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'user/check-username/'],
      login         : function (role, username, password, callback) {
        // Role is optional, defaults to 'user'
        if (!callback) {
          callback = password;
          password = username;
          username = role;
          role     = 'user';
        }
        return this.post('user/login', { role: role, username: username, password: password }, callback);
      },
      forgotPassword: function (role, username, email, callback) {
        // Role is optional, defaults to 'user'
        if (!callback) {
          callback = email;
          email    = username;
          username = role;
          role     = 'user';
        }
        return this.post('user/forgot-password', { role: role, username: username, email: email }, callback);
      },
      resetPassword: function (hash, id, password, callback) {
        return this.post('user/reset-password', { hash: hash, id: id, password: password }, callback);
      },
      resendValidationMail: [GENERATE_GET, 'user/resend-validate-email']
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

        return this.get('message/inbox', { page: page }, callback)
      },
      compose: function (to, title, content, callback) {
        return this.post('message', { to: to, message: { title: title, content: content } }, callback)
      },
      reply: function (to, hash, content, callback) {
        return this.post('message/' + hash, { to: to, message: { content: content } }, callback)
      }
    },
    follow: {
      isFollowing      : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'follow/'],
      fetchAll         : [GENERATE_GET, 'follow/all'],
      fetchAllFollowers: [GENERATE_GET, 'followers'],
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
      }
    },
    media: {
      create         : [GENERATE_POST, 'media'],
      update         : [GENERATE_POST, 'media/update'],
      fetchOwn       : [GENERATE_GET, 'media'],
      fetchBought    : [GENERATE_GET, 'media/bought'],
      fetchByType    : function (type, page, callback) {
        if (!callback) {
          callback = page;
          page     = 1;
        }

        return this.get('media/all/' + type, { page: page }, callback);
      },
      fetchByUsername: [GENERATE_GET_APPEND_PARAM1_TO_URL, 'media/'],
      fetchAlbum     : function (username, albumId, callback) {
        return this.get('media/' + username + '/' + albumId, callback);
      },
      checkAccess    : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'media/access/'],
      remove         : [GENERATE_GET_APPEND_PARAM1_TO_URL, 'media/remove/']
    },
    activity: {
      load: function (username, callback) {
        if (!callback) {
          callback = username;
          username = undefined;
        }

        if (!username) {
          return this.get('activity', callback);
        }

        return this.get('activity/' + username, callback);
      }
    },
    chat: {
      setVIP: function (status, userId, callback) {
        return this.get('chat/vip/' + status + '/' + userId, callback);
      },
      setFreeChat: function (status, callback) {
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
          return this.get('chat/keepalive/' + userId, callback);
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
      }
    }
  };

  Api.prototype = {

    /**
     *  HQ Events
     */

    Events: {
      NOTIFICATIONS: 'notifications',
      CUSTOMER     : 'user',
      MESSAGES     : 'message'
    },

    on: function (event, func) {
      if (!this.eventHandlers) {
        // events not initialized, just return
        return;
      }

      if (typeof func !== 'function') {
        throw 'Not a valid function';
      }

      // If the event is not yet subscribed to, add it, and listen for it
      if (!this.eventHandlers[event]) {
        this.io.socket.on(event, this.trigger.bind(this, event));

        this.eventHandlers[event] = [func];
        return;
      }

      // First check if it exists
      for (var i = 0; i < this.eventHandlers[event].length; i++) {
        if (this.eventHandlers[event][i] === func) {
          return;
        }
      }

      // Add it
      this.eventHandlers[event].push(func);
    },

    off: function (event, func) {
      if (!this.eventHandlers) {
        // events not initialized, just return
        return;
      }

      if (typeof func !== 'function') {
        throw 'Not a valid function';
      }

      // event is not subscribed to
      if (!this.eventHandlers[event]) {
        return;
      }

      // Check if it exists
      for (var i = 0; i < this.eventHandlers[event].length; i++) {
        if (this.eventHandlers[event][i] === func) {
          this.eventHandlers.splice(i, 1);
          break;
        }
      }

      // If there are no more listeners, unsubscribe
      if (this.eventHandlers[event].length === 0) {
        this.socket.off(event);
        delete this.eventHandlers[event];
      }
    },

    trigger: function (event, data) {
      if (!this.eventHandlers) {
        // events not initialized, just return
        return;
      }

      // event is not subscribed to
      if (!this.eventHandlers[event]) {
        return;
      }

      for (var i = 0; i < this.eventHandlers[event].length; i++) {
        setTimeout(this.eventHandlers[event][i].bind(this, data), 0);
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
      this.requestsRunning = 0;
    },

    addToQueue: function (method, url, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params   = {};
      }

      params = params || {};

      if (params.skipQueue) {
        delete params.skipQueue;
        this.requestsRunning++;
        return this.doRequest(method, url, params, function (error, result) {
          this.requestsRunning--;
          setTimeout(function () {
            callback(error, result);
          }, 0);
          this.startQueue();
        }.bind(this));
      }

      this.requestQueue.push([method, url, params, callback]);

      if (this.requestsRunning === 0) {
        this.startQueue();
      }
    },

    // Start the queue async
    startQueue: function () {
      if (this.requestsRunning > 0 || this.requestQueue.length === 0) {
        return;
      }

      setTimeout(this.processQueue.bind(this), 0);
    },

    // Process a queue item and advance to the next
    processQueue: function () {
      if (this.requestQueue.length === 0 || this.requestsRunning > 0) {
        return;
      }

      this.requestsRunning++;

      var currentRequest = this.requestQueue.shift();

      currentRequest[3] = currentRequest[3] || function () {};

      this.doRequest.call(this, currentRequest[0], currentRequest[1], currentRequest[2], function (error, result) {
        this.requestsRunning--;
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
          response = {
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
