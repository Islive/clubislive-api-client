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
  const GENERATE_GET                     = 'GENERATE_GET',
        GENERATE_GET_APPEND_PARAM_TO_URL = 'GENERATE_GET_APPEND_PARAM_TO_URL',
        GENERATE_POST                    = 'GENERATE_POST';

  function Api(apiKey, options) {

    if (!options) {
      options = {};
    }

    if (typeof options === 'string') {
      options = {
        url: options
      };
    }

    if (!options.url) {
      options.url = 'https://api.clubislive.nl/';
    }

    // TODO - test, language

    if (options.url.slice(-1) !== '/') {
      options.url += '/';
    }

    this.url        = options.url;
    this.apiKey     = apiKey;
    this.apiVersion = '1';
    this.language   = options.language || 'en';

    if (options.testMode) {
      this.testMode = true;
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

            if (routeDetails[0] === GENERATE_GET_APPEND_PARAM_TO_URL) {
              if (params[0].slice(-1) !== '/') {
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
      checkUsername   : [GENERATE_GET_APPEND_PARAM_TO_URL, 'performer/check-username/'],
      register        : [GENERATE_POST, 'performer'],
      login           : function (username, password, callback) {
        return this.user.login('performer', username, password, callback);
      },
      search          : GENERATE_GET,
      searchByUsername: [GENERATE_GET_APPEND_PARAM_TO_URL, 'performer/search/'],
      update          : [GENERATE_POST, 'performer/update'],
      forgotPassword: function (username, email, callback) {
        return this.user.forgotPassword('performer', username, email, callback);
      }
    },
    user: {
      checkUsername : [GENERATE_GET_APPEND_PARAM_TO_URL, 'user/check-username/'],
      register      : [GENERATE_POST, 'user'],
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
      update        : [GENERATE_POST, 'user/update'],
      forgotPassword: function (role, username, email, callback) {
        // Role is optional, defaults to 'user'
        if (!callback) {
          callback = email;
          email    = username;
          username = role;
          role     = 'user';
        }
        return this.post('user/forgot-password', { role: role, username: username, email: email }, callback);
      }
    }
  };

  Api.prototype = {
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
        if (obj.hasOwnProperty(p)) {
          var k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
          str.push(typeof v == 'object' ?
                     this.serialize(v, k) :
                   encodeURIComponent(k) + '=' + encodeURIComponent(v));
        }
      }
      return str.join('&');
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

      if (!params.lang) {
        params.lang = this.language;
      }

      if (this.testMode && !params.testmode) {
        params.testmode = 1;
      }

      var c        = this.client(),
          paramStr = this.serialize(params);

      c.open(method, (this.url + url) , true);

      c.setRequestHeader('x-apikey',  this.apiKey);
      c.setRequestHeader('x-version', this.apiVersion);

      if (method === 'POST') {
        c.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
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

        callback(error, response);
      };

      c.send(paramStr);
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

          inputElement.id        = id;
          inputElement.name      = input.name;
          inputElement.placeholder = input.placeholder || input.name;
          inputElement.type      = input.type || 'text';
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
