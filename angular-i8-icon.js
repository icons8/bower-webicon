;(function(window, angular) {

'use strict';

di('ScopeCollection', function(injector) {

  function ScopeCollection() {
    this.collection = [];
  }

  ScopeCollection.prototype = {

    add: function(scope) {
      var
        SvgCumulativeIconSetScope = injector('SvgCumulativeIconSetScope'),
        FontIconSetScope = injector('FontIconSetScope');

      if (scope instanceof SvgCumulativeIconSetScope || scope instanceof FontIconSetScope) {
        this.collection.push(scope);
      }
      else {
        this.collection.unshift(scope);
      }
    },

    preload: function() {
      var
        Promise = injector('Promise');

      return Promise.all(
        this.collection.map(function(item) {
          return Promise.resolve(item.preload())
            .then(null, function() {
              return false;
            })
        })
      )
        .then(function() {
          return true;
        }, function() {
          return false;
        });
    },

    getIconScope: function(iconId, params) {
      var
        Promise = injector('Promise'),
        SvgCumulativeIconSetScope = injector('SvgCumulativeIconSetScope'),
        collection = this.collection,
        promise
        ;

      promise = Promise.all(
        collection.map(function(scope) {
          return Promise.resolve(scope.hasIcon(iconId, params))
            .then(function(value) {
              return value
                ? scope
                : false;
            }, function() {
              return false;
            })
        })
      );

      return promise.then(function(scopes) {
        var
          index;
        for (index = 0; index < scopes.length; index++) {
          if (scopes[index]) {
            return scopes[index];
          }
        }
        return Promise.reject();
      });
    },

    getIcon: function(iconId, params) {
      return this.getIconScope(iconId, params)
        .then(function(scope) {
          return scope.getIcon(iconId, params);
        });
    }

  };

  return ScopeCollection;

});
'use strict';

di('SvgIconSet', function(injector) {

  function SvgIconSet(element, options) {
    var
      log = injector('log'),
      parseSvgOptions = injector('parseSvgOptions'),
      SvgIcon = injector('SvgIcon'),
      nodeWrapper = injector('nodeWrapper'),
      index,
      nodes,
      node,
      iconSize,
      viewBox,
      iconIdResolver,
      svgOptions
      ;

    iconIdResolver = typeof options.iconIdResolver == 'function'
      ? options.iconIdResolver
      : function(value) {
        return value;
      };
    svgOptions = parseSvgOptions(options);

    this.icons = {};

    viewBox = svgOptions.viewBox || element[0].getAttribute('viewBox');
    iconSize = svgOptions.iconSize;

    try {
      nodes = element[0].querySelectorAll('[id]');
      for(index = 0; index < nodes.length; index++) {
        node = nodes[index];
        this.icons[iconIdResolver(node.getAttribute('id'))] = new SvgIcon(nodeWrapper(node.cloneNode(true)), {
          iconSize: iconSize,
          viewBox: viewBox
        });
      }
    }
    catch(e) {
      log.warn(e);
    }
    this.iconSize = iconSize;
    this.viewBox = viewBox;
    this.iconIdResolver = iconIdResolver;
  }

  SvgIconSet.loadByUrl = function(url, options) {
    var
      loadSvgByUrl = injector('loadSvgByUrl');

    return loadSvgByUrl(url)
      .then(function(element) {
        return new SvgIconSet(
          element,
          options
        )
      });
  };

  SvgIconSet.prototype = {

    notExists: function(ids) {
      var
        icons = this.icons;
      return ids.filter(function(id) {
        return !icons.hasOwnProperty(id);
      });
    },

    exists: function(id) {
      return this.icons.hasOwnProperty(id);
    },

    getIconById: function(id) {
      return this.icons.hasOwnProperty(id)
        ? this.icons[id]
        : null;
    },

    merge: function(iconSet) {
      var
        self = this,
        icons = iconSet.icons;

      Object.keys(icons)
        .forEach(function(id) {
          self.icons[id] = icons[id];
        });

      return this;
    },

    mergeByUrl: function(url, options) {
      var
        self = this;

      return SvgIconSet.loadByUrl(url, options)
        .then(function(iconSet) {
          return self.merge(iconSet);
        })
    }

  };

  return SvgIconSet;

});


'use strict';

function createInjector(fn) {
  var
    providers = {},
    instances = {};

  Object.keys(di.providers).forEach(function(name) {
    providers[name] = di.providers[name];
  });

  function injector(name, provider) {
    var
      error,
      baseProvider;

    if (provider) {
      if (instances.hasOwnProperty(name)) {
        error = new Error('Cannot override instantiated service "' + name + '"');
        console.error(error);
        throw error;
      }
      if (typeof provider != 'function') {
        console.error('Provider "' + name + '" is not a function');
        return;
      }
      if (providers.hasOwnProperty(name)) {
        baseProvider = providers[name];
        providers[name] = function(di) {
          return new provider(di, new baseProvider(di));
        };
      }
      else {
        providers[name] = provider;
      }
    }
    else {
      if (!providers[name]) {
        error = new Error('Cannot found service provider "' + name + '"');
        console.error(error);
        throw error;
      }
      if (!instances.hasOwnProperty(name)) {
        try {
          instances[name] = new providers[name](injector);
        }
        catch(error) {
          console.error(error);
          throw error;
        }
      }
      return instances[name];
    }
  }

  injector.has = function(name) {
    return providers.hasOwnProperty(name);
  };

  injector('ready', function(injector) {
    return function(fn) {
      if (typeof fn == 'function') {
        fn(injector);
      }
      else if (fn) {
        console.error('Ready listener not a function');
      }
    }
  });

  if (fn) {
    if (typeof fn == 'function') {
      fn(injector);
    }
    else {
      console.error('Injector initializer not a function');
    }
  }

  (ready.listeners || []).forEach(function(listener) {
    listener(injector);
  });

  return injector;
}
'use strict';

function di(name, provider) {
  var
    baseProvider,
    providers;

  providers = di.providers = di.providers || {};

  if (typeof provider != 'function') {
    console.error('Provider "' + name + '" is not a function');
    return;
  }
  if (providers.hasOwnProperty(name)) {
    baseProvider = providers[name];
    providers[name] = function(di) {
      return new provider(di, new baseProvider(di));
    };
  }
  else {
    providers[name] = provider;
  }
}


'use strict';

di('iconManager', function(injector) {

  var
    CHECK_URL_REGEX = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i,
    DEFAULT_SVG_ICON_SIZE = 24,
    SINGLE_ICONS_COLLECTION_ID = '__SINGLE_ICONS_COLLECTION';

  function IconManager() {
    this._collections = {};
    this._defaultCollectionId = null;
    this._defaultSvgIconSize = DEFAULT_SVG_ICON_SIZE;
  }

  IconManager.prototype = {

    addIcon: function(id, urlConfig, options) {
      var
        url = urlConfig,
        ext;

      if (typeof urlConfig == 'object') {
        url = urlConfig.url;
      }
      ext = typeof url == 'function'
        ? getExt(url())
        : getExt(url + '');

      return ext == 'svg' || !ext
        ? this.addSvgIcon(id, urlConfig, options)
        : this.addImageIcon(id, urlConfig)
      ;

      function getExt(url) {
        return url
            .split('?')[0]
            .split(/[/\\]/)
            .slice(-1)[0]
            .split('.')
            .slice(-1)[0]
            .toLowerCase();
      }
    },

    addSvgIcon: function(id, urlConfig, options) {
      var
        SvgIconScope = injector('SvgIconScope');
      this._getSingleIconsCollection().add(new SvgIconScope(id, urlConfig, options));
      return this;
    },

    addImageIcon: function(id, urlConfig, options) {
      var
        ImageIconScope = injector('ImageIconScope');
      this._getSingleIconsCollection().add(new ImageIconScope(id, urlConfig, options));
      return this;
    },

    addSvgIconSet: function(id, urlConfig, options) {
      var
        SvgCumulativeIconSetScope = injector('SvgCumulativeIconSetScope'),
        SvgIconSetScope = injector('SvgIconSetScope'),
        ScopeConstructor;

      options = options || {};

      ScopeConstructor = options.cumulative
        ? SvgCumulativeIconSetScope
        : SvgIconSetScope;

      this._getCollection(id).add(new ScopeConstructor(id, urlConfig, options));

      return this;
    },

    addFontIconSet: function(id, cssClassConfig, options) {
      var
        FontIconSetScope = injector('FontIconSetScope');
      this._getCollection(id).add(new FontIconSetScope(id, cssClassConfig, options));
      return this;
    },

    addSpriteIconSet: function(id, cssClassConfig, options) {
      var
        SpriteIconSetScope = injector('SpriteIconSetScope');
      this._getCollection(id).add(new SpriteIconSetScope(id, cssClassConfig, options));
      return this;
    },

    addIconSetAlias: function(id, alias) {
      if (!this._collections.hasOwnProperty(alias)) {
        this._collections[alias] = this._getCollection(id);
      }
      return this;
    },

    setDefaultIconSet: function(id) {
      this._defaultCollectionId = id;
      return this;
    },

    setDefaultSvgIconSize: function(iconSize) {
      this._defaultSvgIconSize = iconSize;
      return this;
    },

    getDefaultSvgIconSize: function() {
      return this._defaultSvgIconSize;
    },

    preload: function() {
      var
        collections = this._collections;

      Object.keys(collections).forEach(function(id) {
        collections[id].preload();
      });

    },

    getIcon: function(id, params) {
      var
        parts,
        delimiterPosition,
        iconId,
        iconSetId;

      id = id || '';
      params = params || [];
      parts = id
        .split(/\s+/)
        .filter(function(value) {
          return value;
        });
      id = parts[0];
      Array.prototype.push.apply(params, parts.slice(1));

      if (CHECK_URL_REGEX.test(id)) {
        if (!this.hasSingleIcon(id)) {
          this.addIcon(id, id);
        }
        return this._getSingleIconsCollection().getIcon(id, params)
          .then(null, announceIconNotFoundForPromiseCatch(id));
      }
      iconId = id;
      iconSetId = null;
      delimiterPosition = id.indexOf(':');
      if (delimiterPosition != -1) {
        iconSetId = id.slice(0, delimiterPosition);
        iconId = id.slice(delimiterPosition+1);
      }

      if (iconSetId) {
        if (this.hasIconSet(iconSetId)) {
          return this._getCollection(iconSetId).getIcon(iconId, params)
            .then(null, announceIconNotFoundForPromiseCatch(iconId, iconSetId));
        }
      }
      else {
        if (this.hasSingleIcon(iconId, params)) {
          return this._getSingleIconsCollection().getIcon(iconId, params)
            .then(null, announceIconNotFoundForPromiseCatch(iconId));
        }
        if (this.hasDefaultIconSet()) {
          return this._getCollection(this._defaultCollectionId).getIcon(iconId, params)
            .then(null, announceIconNotFoundForPromiseCatch(iconId, this._defaultCollectionId));
        }
      }

      return announceIconNotFound(id);
    },

    hasSingleIcon: function(id, params) {
      return this._getSingleIconsCollection()
        .collection
        .filter(function(scope) {
          return scope.hasIcon(id, params);
        })
        .length > 0;
    },

    hasIconSet: function(id) {
      return this._collections.hasOwnProperty(id);
    },

    hasDefaultIconSet: function() {
      return this._defaultCollectionId && this.hasIconSet(this._defaultCollectionId);
    },

    _getCollection: function(id) {
      var
        ScopeCollection = injector('ScopeCollection');
      if (!this._collections.hasOwnProperty(id)) {
        this._collections[id] = new ScopeCollection();
      }
      return this._collections[id];
    },

    _getSingleIconsCollection: function() {
      return this._getCollection(SINGLE_ICONS_COLLECTION_ID);
    }

  };


  function announceIconNotFound(iconId, iconSetId) {
    var
      log = injector('log'),
      Promise = injector('Promise'),
      errorMessage = 'icon "' + iconId + '" not found';

    if (iconSetId) {
      errorMessage += ' in "' + iconSetId + '" icon set';
    }
    log.warn(errorMessage);
    return Promise.reject(errorMessage);
  }

  function announceIconNotFoundForPromiseCatch(iconId, iconSetId) {
    return function() {
      return announceIconNotFound(iconId, iconSetId);
    }
  }



  return new IconManager;


});


'use strict';

di('inherit', function(injector) {

  return function inherit(Constructor, Parent, methods, properties) {
    Constructor.prototype = Object.create(Parent.prototype, properties || {});
    Object.keys(methods || {})
      .forEach(function(name) {
        Constructor.prototype[name] = methods[name];
      });

    return Constructor;
  };

});
'use strict';

di('initIconElement', function(injector) {

  return function initIconElement(element, alt, icon) {
    var
      ICON_CLASS = 'i8-icon',
      pieces
      ;

    if (!alt && typeof alt != 'string') {
      icon = String(icon || '')
        .split(':')
        .slice(-1)[0]
        .trim();

      if (/[/\\.]/.test(icon)) {
        pieces = icon
          .split(/[/\\]/)
          .slice(-1)[0]
          .split('.');

        if (pieces.length > 1) {
          pieces = pieces
            .slice(0, -1);
        }
        alt = pieces
          .join('.');
      }
      else {
        alt = icon
          .split(/\s/)
          [0];
      }

    }

    expectAlt(element, alt || '');
    if (!element.hasClass(ICON_CLASS)) {
      element.addClass(ICON_CLASS);
    }
  };

  function expectAlt(element, alt) {

    if (alt != '' && !parentsHaveText()) {
      expectAria('aria-label', alt);
      expectAria('role', 'img');
    }
    else {
      expectAria('aria-hidden', 'true');
    }

    function expectAria(attrName, defaultValue) {
      var
        node = element[0];

      if (!node.hasAttribute(attrName) && !childHasAttribute(node, attrName)) {
        defaultValue = (typeof defaultValue == 'string') ? defaultValue.trim() : '';
        if (defaultValue.length) {
          element.attr(attrName, defaultValue);
        }
      }

      function childHasAttribute(node, attrName) {
        var
          hasChildren = node.hasChildNodes(),
          children,
          index,
          child;

        if (hasChildren) {
          children = node.childNodes;
          for(index = 0; index < children.length; index++){
            child = children[index];
            if(child.nodeType === 1 && child.hasAttribute(attrName) && !isHidden(child)) {
              return true;
            }
          }
        }
        return false;

        function isHidden(node) {
          var
            style = node.currentStyle
              ? node.currentStyle
              : window.getComputedStyle(node);
          return style.display === 'none';
        }
      }
    }

    function parentsHaveText() {
      var
        parent = element.parent();

      if (parent.attr('aria-label') || parent.text().trim()) {
        return true;
      }
      if (parent.prop('tagName') != 'BODY') {
        if (parent.parent().attr('aria-label') || parent.parent().text().trim()) {
          return true;
        }
      }
      return false;
    }

  }

});
'use strict';

di('loadSvgByUrl', function(injector) {

  return function loadSvgByUrl(urlConfig) {
    var
      httpGet = injector('httpGet'),
      log = injector('log'),
      Promise = injector('Promise'),
      el = injector('nodeWrapper'),
      url = urlConfig,
      params = null
      ;

    if (typeof urlConfig == 'object') {
      url = urlConfig.url;
      params = urlConfig.params;
    }

    return httpGet(url, params)
      .then(function(response) {
        var
          element = el('<div>').append(response.data),
          svgElement = element.find('svg');
        return svgElement.length > 0
          ? svgElement
          : element.children().first()
          ;
      }, function(response) {
        var
          message = typeof response == 'string'
            ? response
            : String(response.message || response.data || response.responseText || response.statusText);

        log.warn(message);
        return Promise.reject(message);
      });
  }

});

'use strict';

di('parseSvgOptions', function(injector) {

  return function parseSvgOptions(options) {
    if (options) {
      switch(typeof options) {
        case 'number':
          options = {
            iconSize: options
          };
          break;
        case 'string':
          options = {
            viewBox: options
          };
          break;
      }
    }
    else {
      options = {};
    }

    return {
      iconSize: options.iconSize,
      viewBox: options.viewBox
    }
  }

});
'use strict';

di('publicApi', function(injector) {
  var 
    iconManager = injector('iconManager'),
    ready = injector('ready'),
    api;

  api = {
    icon: function(id, urlConfig, options) {
      iconManager.addIcon(id, urlConfig, options);
      return this;
    },

    svgSet: function(id, urlConfig, options) {
      iconManager.addSvgIconSet(id, urlConfig, options);
      return this;
    },

    font: function(id, cssClassConfig, options) {
      iconManager.addFontIconSet(id, cssClassConfig, options);
      return this;
    },

    sprite: function(id, cssClassConfig, options) {
      iconManager.addSpriteIconSet(id, cssClassConfig, options);
      return this;
    },

    sourceAlias: function(id, alias) {
      iconManager.addIconSetAlias(id, alias);
      return this;
    },

    defaultSvgSetUrl: function(url, options) {
      iconManager
        .addSvgIconSet(url, url, options)
        .setDefaultIconSet(url);
      return this;
    },

    defaultSource: function(id) {
      iconManager.setDefaultIconSet(id);
      return this;
    },

    defaultSvgIconSize: function(iconSize) {
      iconManager.setDefaultSvgIconSize(iconSize);
      return this;
    },

    preload: function() {
      iconManager.preload();
      return this;
    },

    extension: ready

  };

  api.iconSet = api.svgSet;
  api.defaultIconSetUrl = api.defaultSvgSetUrl;
  api.defaultSvgIconSetUrl = api.defaultSvgSetUrl;
  api.alias = api.sourceAlias;
  api.default = api.defaultSource;

  return api;

});
'use strict';

function ready(fn) {
  var
    listeners;

  listeners = ready.listeners = ready.listeners || [];

  if (typeof fn == 'function') {
    listeners.push(fn);
  }
  else if (fn) {
    console.error('Ready listener not a function');
  }

}

'use strict';

ready(function(injector) {
  var
    nodeWrapper = injector('nodeWrapper'),
    head,
    styleEl,
    styleContent;

  styleContent = '<style type="text/css">@charset "UTF-8";i8-icon,i8icon,[i8-icon],[i8icon],[data-i8-icon],[data-i8icon],.i8icon,.i8-icon{display:inline-block;}.i8-svg-icon svg{fill:currentColor;}</style>';

  head = nodeWrapper(window.document).find('head');
  styleEl = head.find('style')[0];

  if (styleEl) {
    if (styleEl.outerHTML == styleContent) {
      return;
    }
  }

  head.prepend(styleContent);

});
'use strict';

di('AbstractCssClassIcon', function(injector) {
  var
    AbstractIcon = injector('AbstractIcon'),
    inherit = injector('inherit')
    ;

  function AbstractCssClassIcon(iconClassName, className) {
    AbstractIcon.call(this, iconClassName);
    this.className = className;
  }

  return inherit(AbstractCssClassIcon, AbstractIcon, {

    render: function(element) {
      var
        classList,
        addedClassName,
        cleaner;

      function getClassList() {
        return element
          .attr('class')
          .split(/\s+/);
      }

      function getAddedClassList(classList) {
        var
          currClassList = getClassList();
        classList = classList || [];
        return currClassList.filter(function(className) {
          return classList.indexOf(className) == -1;
        });
      }

      cleaner = AbstractIcon.prototype.render.call(this, element);

      classList = getClassList();
      element.addClass(this.className);
      addedClassName = getAddedClassList(classList).join(' ');

      return function() {
        element.removeClass(addedClassName);
        cleaner && cleaner();
      }
    }

  });

});
'use strict';

di('AbstractElementIcon', function(injector) {
  var
    AbstractIcon = injector('AbstractIcon'),
    inherit = injector('inherit')
    ;

  function AbstractElementIcon(iconClassName, element) {
    AbstractIcon.call(this, iconClassName);
    this.element = element;
  }

  return inherit(AbstractElementIcon, AbstractIcon, {

    cloneNode: function() {
      return this.element[0].cloneNode(true);
    },

    render: function(element) {
      var
        cleaner;

      cleaner = AbstractIcon.prototype.render.call(this, element);
      element.append(this.cloneNode());

      return function() {
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
        cleaner && cleaner();
      }
    }

  });

});
'use strict';

di('AbstractIcon', function(injector) {

  function AbstractIcon(iconClassName) {
    this.iconClassName = iconClassName;
  }

  AbstractIcon.prototype = {

    render: function(element) {
      var
        iconClassName = this.iconClassName;
      element.addClass(iconClassName);
      return function() {
        element.removeClass(iconClassName);
      }
    }

  };

  return AbstractIcon;
  

});
'use strict';

di('FontIcon', function(injector) {
  var
    AbstractCssClassIcon = injector('AbstractCssClassIcon'),
    inherit = injector('inherit')
    ;

  function FontIcon(className) {
    var
      FONT_ICON_CLASS = 'i8-font-icon';

    AbstractCssClassIcon.call(this, FONT_ICON_CLASS, className);
  }

  return inherit(FontIcon, AbstractCssClassIcon);

});
'use strict';

di('ImageIcon', function(injector) {
  var
    AbstractElementIcon = injector('AbstractElementIcon'),
    inherit = injector('inherit')
    ;

  function ImageIcon(element) {
    var
      IMAGE_ICON_CLASS = 'i8-image-icon';

    element.attr({
      width: '100%',
      height: '100%'
    });

    element.css({
      "pointer-events": 'none',
      display: 'inline-block'
    });

    AbstractElementIcon.call(this, IMAGE_ICON_CLASS, element);
  }

  ImageIcon.loadByUrl = function(urlConfig) {
    var
      buildUrlParams = injector('buildUrlParams'),
      nodeWrapper = injector('nodeWrapper'),
      Promise = injector('Promise'),
      url = urlConfig,
      query,
      element
      ;

    if (typeof urlConfig == 'object') {
      url = urlConfig.url;
      query = buildUrlParams(urlConfig.params);
      if (query) {
        url = [url, query].join('?');
      }
    }

    return new Promise(function(resolve, reject) {
      element = nodeWrapper('<img>');
      element.bind('load', function() {
        resolve(new ImageIcon(element));
      });
      element.bind('error', reject);
      element.attr('src', url);
    });

  };

  return inherit(ImageIcon, AbstractElementIcon);

});
'use strict';

di('SpriteIcon', function(injector) {
  var
    AbstractCssClassIcon = injector('AbstractCssClassIcon'),
    inherit = injector('inherit')
    ;

  function SpriteIcon(className) {
    var
      SPRITE_ICON_CLASS = 'i8-sprite-icon';

    AbstractCssClassIcon.call(this, SPRITE_ICON_CLASS, className);
  }

  return inherit(SpriteIcon, AbstractCssClassIcon);

});
'use strict';

di('SvgIcon', function(injector) {
  var
    AbstractElementIcon = injector('AbstractElementIcon'),
    inherit = injector('inherit')
    ;

  function SvgIcon(element, options) {
    var
      SVG_ICON_CLASS = 'i8-svg-icon',
      nodeWrapper = injector('nodeWrapper'),
      iconManager = injector('iconManager'),
      parseSvgOptions = injector('parseSvgOptions'),
      svgElement,
      svgNode,
      attributes,
      styles,
      defaultAttributes,
      index,
      node,
      iconSize;

    options = parseSvgOptions(options);

    [
      'id',
      'x',
      'y'
    ].forEach(function(attr) {
        element.removeAttr(attr);
      });

    node = element[0];
    if (node.tagName != 'svg') {
      if (node.tagName == 'symbol') {
        svgElement = nodeWrapper('<svg xmlns="http://www.w3.org/2000/svg">');
        svgNode = svgElement[0];
        attributes = node.attributes;
        for (index = 0; index < attributes.length; index++) {
          svgNode.setAttribute(attributes[index].name, attributes[index].value);
        }
        element = svgElement.append(nodeWrapper(node).children());
      }
      else {
        element = nodeWrapper('<svg xmlns="http://www.w3.org/2000/svg">').append(element);
      }
    }
    node = element[0];

    defaultAttributes = {
      xmlns: 'http://www.w3.org/2000/svg',
      version: '1.0'
    };

    Object.keys(defaultAttributes)
      .forEach(function(name) {
        if (!node.getAttribute(name)) {
          node.setAttribute(name, defaultAttributes[name]);
        }
      });

    iconSize = options.iconSize || iconManager.getDefaultSvgIconSize();

    attributes = {
      fit: '',
      height: '100%',
      width: '100%',
      preserveAspectRatio: 'xMidYMid meet',
      viewBox: node.getAttribute('viewBox') || options.viewBox || ('0 0 ' + iconSize + ' ' + iconSize)
    };

    Object.keys(attributes)
      .forEach(function(name) {
        node.setAttribute(name, attributes[name]);
      });

    styles = {
      "pointer-events": 'none',
      display: 'inline-block'
    };

    Object.keys(styles)
      .forEach(function(name) {
        node.style[name] = styles[name];
      });

    this.iconSize = iconSize;
    AbstractElementIcon.call(this, SVG_ICON_CLASS, element);
  }

  SvgIcon.loadByUrl = function(url, options) {
    var
      loadSvgByUrl = injector('loadSvgByUrl');

    return loadSvgByUrl(url)
      .then(function(element) {
        return new SvgIcon(
          element,
          options
        )
      });
  };

  return inherit(SvgIcon, AbstractElementIcon);

});

'use strict';

di('AbstractCssClassIconSetScope', function(injector) {
  var
    AbstractScope = injector('AbstractScope'),
    inherit = injector('inherit')
    ;

  function AbstractCssClassIconSetScope(id, cssClassResolver, options) {
    AbstractScope.call(this, id, options);

    this._classResolver = parseCssClassResolver(cssClassResolver);
  }

  return inherit(AbstractCssClassIconSetScope, AbstractScope, {

    _resolveCssClass: function(className, params) {
      return this._classResolver(className, params);
    }

  });

  function parseCssClassResolver(classResolver) {
    var
      parts;
    if (typeof classResolver == 'function') {
      return classResolver;
    }
    classResolver = (classResolver || '') + '';

    parts = classResolver.split(/[?%]/);
    return function(id) {
      return parts.join(id);
    }
  }

});
'use strict';

di('AbstractRemoteResourceScope', function(injector) {
  var
    AbstractScope = injector('AbstractScope'),
    inherit = injector('inherit')
  ;

  function AbstractRemoteResourceScope(id, urlConfig, options) {
    AbstractScope.call(this, id, options);

    this._urlResolver = parseUrlResolver(urlConfig);
    this._preloadable = this.options.preloadable || typeof this.options.preloadable == 'undefined';
    this._cache = null;
    this._resource = null;
  }

  return inherit(AbstractRemoteResourceScope, AbstractScope, {

    preload: function() {
      return this._preloadable
        ? this._getResource()
        : true;
    },

    _resolveUrl: function(url) {
      return this._urlResolver(url);
    },

    _getResource: function() {
      var
        promise,
        self = this;

      if (this._cache) {
        return this._cache;
      }
      promise = this._cache = this._loadResource();
      promise.then(null,
        function(resource) {
          self._resource = resource;
        },
        function() {
          self._cache = null;
        }
      );

      return promise;
    },

    _loadResource: function() {
      var
        Promise = injector('Promise');
      return Promise.reject();
    }

  });

  function parseUrlResolver(urlConfig) {
    var
      mergeObjects = injector('mergeObjects'),
      url,
      urlFn,
      params = null;

    if (url && typeof url == 'object') {
      url = urlConfig.url;
      params = urlConfig.params;
    }
    else {
      url = urlConfig;
    }

    urlFn = (typeof url == 'function')
      ? url
      : function() { return url; };

    return function(/* value[, value[, ...]]] */) {
      var
        urlConfig,
        _params = null,
        url
        ;

      urlConfig = urlFn.apply(null, Array.prototype.slice.call(arguments));
      url = urlConfig;
      if (urlConfig && typeof urlConfig == 'object') {
        url = urlConfig.url;
        _params = urlConfig.params;
      }

      url = String(url || '');
      if (url.slice(0, 2) === '//') {
        url = window.document.location.protocol + url;
      }

      return {
        url: url,
        params: mergeObjects({}, params || {}, _params || {})
      }
    };
  }

});
'use strict';

di('AbstractRemoteSvgResourceScope', function(injector) {
  var
    AbstractRemoteResourceScope = injector('AbstractRemoteResourceScope'),
    inherit = injector('inherit'),
    parseSvgOptions = injector('parseSvgOptions')
  ;

  function AbstractRemoteSvgResourceScope(id, urlConfig, options) {
    var
      svgOptions = parseSvgOptions(options),
      self = this;

    AbstractRemoteResourceScope.call(this, id, urlConfig, options);

    Object.keys(svgOptions)
      .forEach(function(name) {
        self.options[name] = svgOptions[name];
      });
  }

  return inherit(AbstractRemoteSvgResourceScope, AbstractRemoteResourceScope);

});
'use strict';

di('AbstractScope', function(injector) {

  function AbstractScope(id, options) {
    options = options && typeof options == 'object'
      ? options
      : {};

    this.id = id;
    this.options = options;

    this._iconIdParser = parseIconIdResolver(options.iconIdParser);
    this._iconIdResolver = parseIconIdResolver(options.iconIdResolver);
  }

  AbstractScope.prototype = {

    preload: function() {
      return true;
    },

    hasIcon: function() {
      return true;
    },

    _parseIconId: function(iconId, params) {
      return this._iconIdParser(iconId, params);
    },

    _resolveIconId: function(iconId) {
      return this._iconIdResolver(iconId);
    }

  };

  return AbstractScope;

  function parseIconIdResolver(value) {
    return typeof value == 'function'
      ? value
      : function(value) {
        return value;
      };
  }

});
'use strict';

di('FontIconSetScope', function(injector) {
  var
    AbstractCssClassIconSetScope = injector('AbstractCssClassIconSetScope'),
    inherit = injector('inherit')
    ;

  function FontIconSetScope(id, cssClassResolver, options) {
    AbstractCssClassIconSetScope.call(this, id, cssClassResolver, options);
  }

  return inherit(FontIconSetScope, AbstractCssClassIconSetScope, {

    getIcon: function(iconId, params) {
      var
        FontIcon = injector('FontIcon');
      return new FontIcon(this._resolveCssClass(this._parseIconId(iconId, params), params));
    }

  });

});
'use strict';

di('ImageIconScope', function(injector) {
  var
    AbstractRemoteResourceScope = injector('AbstractRemoteResourceScope'),
    inherit = injector('inherit')
    ;

  function ImageIconScope(id, urlConfig, options) {
    AbstractRemoteResourceScope.call(this, id, urlConfig, options);
  }

  return inherit(ImageIconScope, AbstractRemoteResourceScope, {

    _loadResource: function() {
      var
        ImageIcon = injector('ImageIcon');
      return ImageIcon.loadByUrl(this._resolveUrl());
    },

    hasIcon: function(iconId, params) {
      return this._parseIconId(iconId, params) == this._resolveIconId(this.id);
    },

    getIcon: function() {
      return this._getResource();
    }

  });

});
'use strict';

di('SpriteIconSetScope', function(injector) {
  var
    AbstractCssClassIconSetScope = injector('AbstractCssClassIconSetScope'),
    inherit = injector('inherit')
    ;

  function SpriteIconSetScope(id, classResolver, options) {
    AbstractCssClassIconSetScope.call(this, id, classResolver, options);
  }

  return inherit(SpriteIconSetScope, AbstractCssClassIconSetScope, {

    getIcon: function(iconId, params) {
      var
        SpriteIcon = injector('SpriteIcon');
      return new SpriteIcon(this._resolveCssClass(this._parseIconId(iconId, params), params));
    }

  });

});
'use strict';

di('SvgCumulativeIconSetScope', function(injector) {
  var
    AbstractRemoteSvgResourceScope = injector('AbstractRemoteSvgResourceScope'),
    inherit = injector('inherit')
    ;

  function SvgCumulativeIconSetScope(id, urlConfig, options) {
    var
      DEFAULT_WAIT_DURATION = 10;

    AbstractRemoteSvgResourceScope.call(this, id, urlConfig, options);

    this.waitDuration = this.options.waitDuration || DEFAULT_WAIT_DURATION;
    this.waitPromise = null;
    this.waitIconIds = [];
  }

  return inherit(SvgCumulativeIconSetScope, AbstractRemoteSvgResourceScope, {

    _loadResource: function() {
      var
        SvgIconSet = injector('SvgIconSet');
      return SvgIconSet.loadByUrl(this._resolveUrl(this.waitIconIds), this.options);
    },

    preload: function() {
      return true;
    },

    getIcon: function(iconId, params) {
      var
        Promise = injector('Promise'),
        timeout = injector('timeout'),
        self = this;

      iconId = this._parseIconId(iconId, params);

      if (this._resource && this._resource.exists(iconId)) {
        return Promise.resolve(this._resource.getIconById(iconId));
      }

      if (this.waitPromise) {
        if (this.waitIconIds.indexOf(iconId) == -1) {
          this.waitIconIds.push(iconId);
        }
      }
      else {
        this.waitIconIds = [iconId];
        this.waitPromise = timeout(this.waitDuration).then(function() {
          self.waitPromise = null;
          if (!self._resource) {
            return self._getResource();
          }
          return self._resource.mergeByUrl(
            self._resolveUrl(self._resource.notExists(self.waitIconIds)),
            self.options
          );
        });
      }

      return this.waitPromise
        .then(function(iconSet) {
          var
            icon = iconSet.getIconById(iconId);
          return icon
            ? icon
            : Promise.reject();
        });
    }

  });

});
'use strict';

di('SvgIconScope', function(injector) {
  var
    AbstractRemoteSvgResourceScope = injector('AbstractRemoteSvgResourceScope'),
    inherit = injector('inherit')
    ;

  function SvgIconScope(id, urlConfig, options) {
    AbstractRemoteSvgResourceScope.call(this, id, urlConfig, options);
  }

  return inherit(SvgIconScope, AbstractRemoteSvgResourceScope, {

    _loadResource: function() {
      var
        SvgIcon = injector('SvgIcon');
      return SvgIcon.loadByUrl(this._resolveUrl(), this.options);
    },

    hasIcon: function(iconId, params) {
      return this._parseIconId(iconId, params) == this._resolveIconId(this.id);
    },

    getIcon: function() {
      return this._getResource();
    }

  });

});
'use strict';

di('SvgIconSetScope', function(injector) {
  var
    AbstractRemoteSvgResourceScope = injector('AbstractRemoteSvgResourceScope'),
    inherit = injector('inherit')
    ;

  function SvgIconSetScope(id, urlConfig, options) {
    AbstractRemoteSvgResourceScope.call(this, id, urlConfig, options);
  }

  return inherit(SvgIconSetScope, AbstractRemoteSvgResourceScope, {

    _loadResource: function() {
      var
        SvgIconSet = injector('SvgIconSet');
      return SvgIconSet.loadByUrl(this._resolveUrl(), this.options);
    },

    hasIcon: function(iconId, params) {
      iconId = this._parseIconId(iconId, params);

      return this._getResource()
        .then(function(iconSet) {
          return iconSet.exists(iconId);
        })
    },

    getIcon: function(iconId, params) {
      var
        Promise = injector('Promise');

      iconId = this._parseIconId(iconId, params);
      return this._getResource()
        .then(function(iconSet) {
          var
            icon = iconSet.getIconById(iconId);
          return icon
            ? icon
            : Promise.reject();
        })
    }

  });

});
'use strict';

di('IconDirective', function(injector) {

  /**
   * @ngdoc directive
   * @name i8Icon
   * @module i8.icon
   *
   * @restrict EA
   *
   * @description
   */

  function IconDirective($i8Icon) {
    return {
      restrict: 'EA',
      scope: true,
      link: function (scope, element, attrs) {
        var
          initIconElement = injector('initIconElement'),
          altAttrName = attrs.$normalize(attrs.$attr.alt || ''),
          alt,
          attrName =  attrs.$normalize(attrs.$attr.icon || attrs.$attr.i8Icon || ''),
          cleaner = null
          ;

        alt = altAttrName
          ? attrs[altAttrName]
          : null;

        initIconElement(element, alt, attrs[attrName]);

        if (attrName) {
          attrs.$observe(attrName, function(icon) {
            cleaner && cleaner();
            cleaner = null;
            if (icon) {
              $i8Icon(icon).then(function(icon) {
                cleaner = icon.render(element);
              });
            }
          });
        }

      }
    };
  }

  IconDirective.$inject = [
    '$i8Icon'
  ];

  return IconDirective;

});



'use strict';

di('IconProvider', function(injector) {

  /**
   * @ngdoc service
   * @name $i8IconProvider
   * @module i8.icon
   *
   * @description
   *
   */

  function IconProvider() {
    var
      lazyPreload = false;

    this.preload = function() {
      lazyPreload = true;
      return this;
    };

    this.$get = ['$injector', function($injector) {
      var
        iconManager = injector('iconManager'),
        ensureDependenciesRegistered = injector('ensureDependenciesRegistered'),
        iconService;

      ensureDependenciesRegistered($injector);

      iconService = function(id) {
        return iconManager.getIcon(id);
      };
      iconService.preload = function() {
        iconManager.preload();
      };

      iconService.$checkLazyPreload = function() {
        if (lazyPreload) {
          this.preload();
        }
      };

      return iconService;
    }];

  }

  IconProvider.prototype = injector('publicApi');

  return IconProvider;
});


'use strict';

di('buildUrlParams', function(injector) {

  return function buildUrlParams(params) {
    var
      parts = [];

    params = params || {};
    Object.keys(params)
      .filter(function() {
        return typeof params[key] != 'undefined' && params[key] !== null;
      })
      .map(function(key) {
        return !Array.isArray(params[key])
          ? [params[key]]
          : params[key];
      })
      .forEach(function(key) {
        params[key].forEach(function(value) {
          parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value + ''));
        });
      });

    return parts.join('&');
  };

});
'use strict';

di('ensureDependenciesRegistered', function(injector) {
  var
    registered = false;

  return function ensureDependenciesRegistered($injector) {
    if (registered) {
      return;
    }

    injector('$injector', function() {
      return $injector;
    });

    injector('log', function() {
      return $injector.get('$log');
    });

    injector('httpGet', function() {
      var
        $http = $injector.get('$http'),
        $templateCache = $injector.get('$templateCache')
        ;

      return function(url, params) {
        var
          options = {
            cache: $templateCache
          };
        if (params && typeof params == 'object' && Object.keys(params).length > 0) {
          options.params = params;
        }
        return $http.get(url, options);
      }
    });

    injector('Promise', function() {
      var
        $q = $injector.get('$q'),
        $rootScope = $injector.get('$rootScope');

      function ensureDigestDecorator(fn) {
        return function() {
          var
            args = Array.prototype.slice.call(arguments);

          if (!$rootScope.$$phase) {
            $rootScope.$apply(function() {
              fn.apply(this, args);
            })
          }
          else {
            fn.apply(this, args);
          }
        }
      }

      function Promise(value) {
        var
          deferred;
        if (typeof value != 'function') {
          return Promise.resolve(value);
        }
        deferred = $q.defer();
        value(
          ensureDigestDecorator(deferred.resolve),
          ensureDigestDecorator(deferred.reject)
        );
        return deferred.promise;
      }

      Promise.reject = $q.reject;
      Promise.resolve = $q.when;
      Promise.all = $q.all;

      return Promise;
    });

    injector('timeout', function() {
      var
        $timeout = $injector.get('$timeout');

      return function(fn, delay) {
        if (typeof fn != 'function') {
          delay = fn;
          fn = function() {};
        }
        return $timeout(fn, delay);
      };
    });

    registered = true;
  }

});


'use strict';

di('mergeObjects', function() {

  return function mergeObjects(to /*, from [, from[, ...]]*/) {
    var
      args = Array.prototype.slice.call(arguments);
    if (args.length == 0) {
      return {};
    }
    if (args.length < 2) {
      if (!Array.isArray(to)) {
        return to;
      }
      args = to;
      to = args[0];
    }
    args.slice(1).forEach(function(from) {
      to = _merge(to, from);
    });
    return to;

    function _merge(to, from) {
      if (!to || !from || typeof to != 'object' || typeof from != 'object' || Array.isArray(to) || Array.isArray(from)) {
        return from;
      }
      Object.keys(from).forEach(function(key) {
        if (to.hasOwnProperty(key)) {
          to[key] = _merge(to[key], from[key]);
        }
        else {
          to[key] = from[key];
        }
      });
      return to;
    }
  };

});


'use strict';

di('nodeWrapper', function(injector) {
  var
    angular = injector('angular');
  return angular.element;
});
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

function extension(fn) {
  ready(fn);
}
'use strict';

/**
 * @ngdoc module
 * @name i8.icon
 * @description
 * Icon
 */

angular.module('i8.icon', [])
  .config([
    '$provide',
    '$compileProvider',
    function($provide, $compileProvider) {
      var
        injector = createInjector(function(injector) {
          injector('angular', function() {
            return angular;
          })
        });
      $provide.provider('$i8Icon', injector('IconProvider'));
      $compileProvider.directive('i8Icon', injector('IconDirective'));
    }
  ])
  .run([
    '$i8Icon',
    function($i8Icon) {
      $i8Icon.$checkLazyPreload();
    }
  ])
;

})(window, window.angular);