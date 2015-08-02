;(function(window, jQuery, angular) {

'use strict';

var
  weLoveSvgConfig = {
    svgSets: {
      url: '//cdn.rawgit.com/icons8/welovesvg/78f7305/libs',
      libs: [
        'brandico',
        'elusive-icons',
        'entypo',
        'font-awesome',
        'fontelico',
        'foundation-icons',
        'glyphicons-halflings',
        'icomoon-free',
        'icons8-color-icons',
        'icons8-win10',
        'icons8-wpf',
        'ionicons',
        'ligaturesymbols',
        'linecons',
        { lib: 'maki', name: 'maki-12' },
        { lib: 'maki', name: 'maki-18' },
        { lib: 'maki', name: 'maki-24' },
        "material-icons",
        'meteocons',
        'metrize-icons',
        'mfglabs-iconset',
        'octicons',
        'open-iconic',
        'openwebicons',
        'raphael-icons',
        'simple-line-icons',
        'stateface',
        'stroke7',
        'typicons',
        'weather-icons',
        'webhostinghub-glyphs',
        'zocial'
      ]
    },
    aliases: {
      "color-icons": 'icons8-color-icons',
      "flat-color-icons": 'icons8-color-icons',
      "win10": 'icons8-win10',
      "wpf-ui-framework-icons": 'icons8-wpf',
      "wpf": 'icons8-wpf',
      "glyphicons": 'glyphicons-halflings',
      "ion": 'ionicons',
      "lsf": 'ligaturesymbols',
      "maki": 'maki-24',
      "material-design-icons": 'material-icons',
      "material": 'material-icons',
      "weather": 'weather-icons',
      "icomoon": 'icomoon-free',
      "elusive": 'elusive-icons',
      "fa": 'font-awesome',
      "foundation": 'foundation-icons',
      "metrize": 'metrize-icons',
      "mfglabs": 'mfglabs-iconset',
      "iconic": 'open-iconic',
      "raphael": 'raphael-icons',
      "simple-line": 'simple-line-icons',
      "webhostinghub": 'webhostinghub-glyphs'
    }
  };

'use strict';

function weLoveSvgExtension(di, config) {
  var
    iconManager = di('iconManager'),
    iconIdFilter,
    materialDesignIconIdResolver,
    makiIconIdResolver,
    options,
    svgSets;

  iconIdFilter = function(id) {
    return String(id || '')
      .replace(/_/g, '-');
  };

  materialDesignIconIdResolver = function(id) {
    return iconIdFilter(id)
      .replace(/^ic-/, '')
      .replace(/-\d+px$/, '');
  };

  makiIconIdResolver = function(id) {
    return iconIdFilter(id)
      .replace(/-\d+$/, '');
  };

  options = {
    iconIdResolver: iconIdFilter,
    iconIdParser: iconIdFilter,
    preloadable: false
  };

  function addSvgIconSet(name, url) {
    var
      opts;

    switch(name) {
      case 'maki':
        opts = copy(options, { iconIdResolver: makiIconIdResolver });
        break;

      case 'material-design-icons':
        opts = copy(options, { iconIdResolver: materialDesignIconIdResolver });
        break;

      default:
        opts = copy(options);
    }

    iconManager.addSvgIconSet(name, url, opts)
  }

  svgSets = config.svgSets;
  svgSets.libs.forEach(function(name) {
    var
      lib,
      filename;

    if (typeof name == 'object') {
      lib = name.lib;
      filename = name.filename || (name.name || lib) + '.svg';
      name = name.name || lib;
    }
    else {
      lib = name;
      filename = name + '.svg';
    }

    addSvgIconSet(
      name,
      [svgSets.url, lib, filename].join('/')
    );
  });

  Object.keys(config.libs || {}).forEach(function(name) {
    addSvgIconSet(name, config.libs[name]);
  });

  Object.keys(config.aliases || {}).forEach(function(alias) {
    iconManager.addIconSetAlias(
      config.aliases[alias],
      alias
    )
  });

  function copy(/* ...objects */) {
    var
      result = {};

    Array.prototype.slice.call(arguments).forEach(function(object) {
      if (object) {
        Object.keys(object).forEach(function(key) {
          result[key] = object[key];
        });
      }
    });

    return result;
  }

}
'use strict';

extension(function(injector) {

  weLoveSvgExtension(injector, weLoveSvgConfig);

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