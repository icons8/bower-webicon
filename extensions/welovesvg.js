;(function(window, jQuery, angular) {

'use strict';

var
  weLoveSvgConfig = {
    svgSets: {
      url: '//cdn.rawgit.com/icons8/welovesvg/c10018bec3184a8b72a3d6485904c1eba4dc876f/libs',
      libs: {
        "brandico": 'latest',
        "elusive-icons": '2.0.0',
        "entypo": 'latest',
        "flat-color-icons": '1.0.2',
        "font-awesome": '4.3.0',
        "fontelico": 'latest',
        "foundation-icons": '3.0',
        "glyphicons-halflings": "1.9",
        "icomoon-free": 'latest',
        "ionicons": '2.0.1',
        "ligaturesymbols": '2.11',
        "linecons": 'latest',
        "maki-12px": { lib: 'maki', version: '0.4.5', filename: 'maki-12.svg' },
        "maki-18px": { lib: 'maki', version: '0.4.5', filename: 'maki-18.svg' },
        "maki-24px": { lib: 'maki', version: '0.4.5', filename: 'maki-24.svg' },
        "material-design-icons-18px": { lib: 'material-design-icons', version: '1.0.2' },
        "material-design-icons-24px": { lib: 'material-design-icons', version: '1.0.2' },
        "material-design-icons-36px": { lib: 'material-design-icons', version: '1.0.2' },
        "material-design-icons-48px": { lib: 'material-design-icons', version: '1.0.2' },
        "meteocons": 'latest',
        "metrize-icons": '1.0',
        "mfglabs-iconset": 'latest',
        "octicons": '2.2.2',
        "open-iconic": '1.1.1',
        "openwebicons": '1.3.2',
        "raphael-icons": 'latest',
        "simple-line-icons": '1.0.0',
        "stateface": '1.0.0',
        "stroke7": '1.2.0',
        "typicons": '2.0.7',
        "weather-icons": '1.3.2',
        "webhostinghub-glyphs": 'latest',
        "wpf-ui-framework-icons": 'latest',
        "zocial": '1.0.0'
      }
    },
    aliases: {
      "color-icons": 'flat-color-icons',
      "glyphicons": 'glyphicons-halflings',
      "ion": 'ionicons',
      "lsf": 'ligaturesymbols',
      "maki": 'maki-24px',
      "material-design-icons": 'material-design-icons-24px',
      "material-icons": 'material-design-icons'
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
  Object.keys(svgSets.libs || {}).forEach(function(name) {
    var
      lib,
      version,
      filename;

    lib = name;
    filename = name + '.svg';

    if (typeof svgSets.libs[name] == 'string') {
      version = svgSets.libs[name];
    }
    else {
      lib = svgSets.libs[name].lib || lib;
      version = svgSets.libs[name].version || 'latest';
      filename = svgSets.libs[name].filename || filename;
    }

    addSvgIconSet(
      name,
      [svgSets.url, lib, version, filename].join('/')
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