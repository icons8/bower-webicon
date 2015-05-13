;(function(window, jQuery, angular) {

'use strict';

var
  i8ApiConfig = {
    gateway: {
      url: '//api.icons8.com/api/iconsets/svg-symbol'
    }
  };


'use strict';

function i8ApiExtension(injector, config) {
  var
    publicApi = injector('publicApi'),
    iconManager = injector('iconManager'),
    platforms = {
      ios8: ['ios', 'ios7', 'i'],
      win8: ['win', 'w'],
      android: ['kitkat', 'ak', 'a-k', 'k'],
      androidL: ['android-l', 'al', 'a-l', 'l'],
      flat_color: ['color', 'c', 'colored']
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
    .setDefaultIconSet('i8')
    .addSvgIconSet(
    'i8',
    function(icons) {
      var
        options = {
          url: config.gateway.url,
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

  publicApi.i8ApiToken = function(token) {
    apiToken = token;
  };

  if (injector.has('configPerformer')) {
    injector('configPerformer').strategy(function(config) {
      if (typeof config.i8ApiToken != 'undefined') {
        publicApi.i8ApiToken(config.i8ApiToken);
      }
    });
  }

}


'use strict';

var
  materialDesignIconsConfig = {
    version: '1.0.1',
    categories: [
      'action',
      'alert',
      'av',
      'communication',
      'content',
      'device',
      'editor',
      'file',
      'hardware',
      'image',
      'maps',
      'navigation',
      'notification',
      'social',
      'toggle'
    ]
  };


'use strict';

function materialDesignIconsExtension(di, config) {
  var
    iconManager = di('iconManager'),
    iconIdFilter,
    options;

  iconIdFilter = function(id) {
    return String(id || '')
      .replace(/_/g, '-')
      .replace(/^ic-/, '')
      .replace(/-\d+px$/, '');
  };

  options = {
    iconIdResolver: iconIdFilter,
    iconIdParser: iconIdFilter,
    preloadable: false
  };

  config.categories
    .forEach(function(category) {
      iconManager.addSvgIconSet(
        'md-' + category,
        '//cdn.rawgit.com/google/material-design-icons/' + config.version + '/sprites/svg-sprite/svg-sprite-' + category + '.svg',
        options
      )
    });

}
'use strict';

extension(function(injector) {
  var
    iconManager = injector('iconManager');

  iconManager
    .addFontIconSet(
      'fa',
      function(name, params) {
        var
          classBuilder = [
            'fa',
            'fa-' + name
          ];
        params = params || [];
        Array.prototype.push.apply(
          classBuilder,
          params.map(function(param) {
            return 'fa-'+param
          })
        );
        return classBuilder.join(' ')
      }
    );

});

'use strict';

extension(function(injector) {
  var
    iconManager = injector('iconManager');

  iconManager
    .addIconSetAlias('glyphicon', 'gi')
    .addFontIconSet('glyphicon', 'glyphicon glyphicon-?');

});
'use strict';

extension(function(injector) {

  i8ApiExtension(injector, i8ApiConfig);

});


'use strict';

extension(function(injector) {

  materialDesignIconsExtension(injector, materialDesignIconsConfig);

});
'use strict';

if (typeof jQuery != 'undefined' && jQuery.fn.i8icon) {
  jQuery.fn.i8icon.extension(extensionsBinder);
}
if (typeof angular != 'undefined' && angular.module('i8.icon')) {
  angular.module('i8.icon').config([
    '$i8IconProvider',
    function($i8IconProvider) {
      $i8IconProvider.extension(extensionsBinder)
    }
  ])
}

function extensionsBinder(injector) {

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