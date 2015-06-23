;(function(window, jQuery, angular) {

'use strict';

var
  icons8Config = {
    api: {
      url: 'https://api.icons8.com/api/iconsets/svg-symbol'
    }
  };


'use strict';

function icons8Extension(injector, config) {
  var
    publicApi = injector('publicApi'),
    iconManager = injector('iconManager'),
    platforms = {
      ios8: ['ios7', 'i7', 'i8', 'ios9', 'i9'],
      win8: ['w8', 'windows8', 'windows-8', 'metro', 'windows-metro'],
      android: ['android-kitkat', 'kitkat', 'ak'],
      androidL: ['android-lollipop', 'android-l', 'lollipop', 'al'],
      color: ['flat_color', 'c', 'colored'],
      win10: ['w10', 'windows10', 'windows-10']
    },
    platformsMap,
    apiToken;

  platformsMap = {};
  Object.keys(platforms).forEach(function(platform) {
    platformsMap[platform.toLowerCase()] = platform;
    platforms[platform].forEach(function(alias) {
      platformsMap[alias] = platform;
    });
  });

  iconManager
    .setDefaultIconSet('icons8')
    .addSvgIconSet(
      'icons8',
      function(icons) {
        var
          options = {
            url: config.api.url,
            params: {}
          };

        if (icons) {
          if (!Array.isArray(icons)) {
            icons = [icons];
          }
          options.params.icons = icons.join(',');
        }
        if (apiToken) {
          options.params.token = apiToken;
        }
        return options;
      },
      {
        cumulative: true,
        iconIdParser: function(id, params) {
          var
            index;
          id = String(id || '');
          if (!Array.isArray(params)) {
            params = [];
          }
          params = params.map(function(param) {
            return String(param).toLowerCase();
          });
          for (index = 0; index < params.length; index++) {
            if (platformsMap.hasOwnProperty(params[index])) {
              return [platformsMap[params[index]], id].join('-');
            }
          }

          return [platformsMap['c'], id].join('-');
        }
      }
    );

  publicApi.icons8Token = function(token) {
    apiToken = token;
  };

  if (injector.has('configPerformer')) {
    injector('configPerformer').strategy(function(config) {
      if (typeof config.icons8Token != 'undefined') {
        publicApi.icons8Token(config.icons8Token);
      }
    });
  }

}


'use strict';

extension(function(injector) {

  icons8Extension(injector, icons8Config);

});


'use strict';

if (typeof jQuery != 'undefined' && jQuery.fn.webicon) {
  jQuery.fn.webicon.extension(extensionBinder);
}
if (typeof angular != 'undefined' && angular.module('webicon')) {
  angular.module('webicon').config([
    '$webiconProvider',
    function($webiconProvider) {
      $webiconProvider.extension(extensionBinder)
    }
  ])
}

function extensionBinder(injector) {

  (extension.extensions || []).forEach(function(extension) {
    extension(injector);
  });
  extension.listeners = extension.listeners || [];
  extension.listeners.push(function(extension) {
    extension(injector);
  });
}

function extension(fn) {
  var
    listeners,
    extensions;

  listeners = extension.listeners = extension.listeners || [];
  extensions = extension.extensions = extension.extensions || [];

  if (typeof fn != 'function') {
    console.error('Extension is not a function');
    return;
  }
  extensions.push(fn);
  listeners.forEach(function(listener) {
    listener(fn);
  });
}


})(window, window.jQuery, window.angular);