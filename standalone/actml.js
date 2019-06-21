(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.actml = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

exports.default = function (func, props, children) {
  var callChildren = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var result, i;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              result = [];

              if (!(children && children.length > 0)) {
                _context.next = 13;
                break;
              }

              i = 0;

            case 3:
              if (!(i < children.length)) {
                _context.next = 13;
                break;
              }

              if (!(0, _isActMLElement2.default)(children[i])) {
                _context.next = 10;
                break;
              }

              _context.t0 = result;
              _context.next = 8;
              return children[i].run(element);

            case 8:
              _context.t1 = _context.sent;

              _context.t0.push.call(_context.t0, _context.t1);

            case 10:
              i++;
              _context.next = 3;
              break;

            case 13:
              return _context.abrupt('return', result);

            case 14:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function callChildren() {
      return _ref.apply(this, arguments);
    };
  }();

  var run = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(parent) {
      var processChildrenAutomatically, result, genResult, toGenValue;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              element.parent = parent;

              processChildrenAutomatically = true;
              result = func(_extends({}, (0, _getNormalizeProps2.default)(element), {
                useChildren: function useChildren() {
                  processChildrenAutomatically = false;
                  return [callChildren, children];
                }
              }));
              genResult = void 0, toGenValue = void 0;

              // handling a promise

              if (!(result && result.then)) {
                _context2.next = 10;
                break;
              }

              _context2.next = 7;
              return result;

            case 7:
              result = _context2.sent;
              _context2.next = 27;
              break;

            case 10:
              if (!(result && typeof result.next === 'function')) {
                _context2.next = 23;
                break;
              }

              genResult = result.next();

            case 12:
              if (genResult.done) {
                _context2.next = 20;
                break;
              }

              if (!(0, _isActMLElement2.default)(genResult.value)) {
                _context2.next = 17;
                break;
              }

              _context2.next = 16;
              return genResult.value.run(element);

            case 16:
              toGenValue = _context2.sent;

            case 17:
              genResult = result.next(toGenValue);
              _context2.next = 12;
              break;

            case 20:
              result = genResult.value;

              // handling another ActML element
              _context2.next = 27;
              break;

            case 23:
              if (!(0, _isActMLElement2.default)(result)) {
                _context2.next = 27;
                break;
              }

              _context2.next = 26;
              return result.run(element);

            case 26:
              result = _context2.sent;

            case 27:

              // exports
              (0, _useProps2.default)(props).exists('exports', function (exportsKeyword) {
                element.scope[exportsKeyword] = result;
              });

              // handling children

              if (!processChildrenAutomatically) {
                _context2.next = 31;
                break;
              }

              _context2.next = 31;
              return callChildren();

            case 31:
              return _context2.abrupt('return', result);

            case 32:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function run(_x) {
      return _ref2.apply(this, arguments);
    };
  }();

  var element = {
    scope: {},
    meta: (0, _getMeta2.default)(func, props),
    parent: null,
    run: run
  };

  return element;
};

var _getNormalizeProps = require('./utils/getNormalizeProps');

var _getNormalizeProps2 = _interopRequireDefault(_getNormalizeProps);

var _getMeta = require('./utils/getMeta');

var _getMeta2 = _interopRequireDefault(_getMeta);

var _useProps = require('./utils/useProps');

var _useProps2 = _interopRequireDefault(_useProps);

var _isActMLElement = require('./utils/isActMLElement');

var _isActMLElement2 = _interopRequireDefault(_isActMLElement);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _asyncToGenerator(fn) {
  return function () {
    var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);var value = info.value;
        } catch (error) {
          reject(error);return;
        }if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }return step("next");
    });
  };
} /* eslint-disable no-use-before-define */

;

},{"./utils/getMeta":3,"./utils/getNormalizeProps":4,"./utils/isActMLElement":5,"./utils/useProps":6}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = exports.A = undefined;

var _ActElement = require('./ActElement');

var _ActElement2 = _interopRequireDefault(_ActElement);

var _isActMLElement = require('./utils/isActMLElement');

var _isActMLElement2 = _interopRequireDefault(_isActMLElement);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function create(func, props) {
  for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  return (0, _ActElement2.default)(func, props, children);
}
function run(element) {
  if (!(0, _isActMLElement2.default)(element)) {
    throw new Error('ActML element expected. Instead ' + element.toString() + ' passed.');
  }
  return element.run();
}

var A = create;

exports.A = A;
exports.run = run;

},{"./ActElement":1,"./utils/isActMLElement":5}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getMeta;
var getFuncName = function getFuncName(func) {
  if (func.name) return func.name;

  var result = /^function\s+([\w\$]+)\s*\(/.exec(func.toString());

  return result ? result[1] : 'unknown';
};

function getMeta(func, props) {
  return {
    name: getFuncName(func),
    props: props,
    propNames: props ? Object.keys(props) : null
  };
};

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getNormalizeProps;
var resolveProp = function resolveProp(prop, parent, errorMessage, stack) {
  if (parent.scope[prop]) {
    return parent.scope[prop];
  } else if (parent.parent) {
    stack.push(parent.meta.name);
    return resolveProp(prop, parent.parent, errorMessage, stack);
  }
  stack.push(parent.meta.name);
  throw new Error(errorMessage + '\n\nStack:\n' + stack.map(function (n) {
    return '  <' + n + '>';
  }).join('\n'));
};

function getNormalizeProps(element) {
  var _element$meta = element.meta,
      props = _element$meta.props,
      propNames = _element$meta.propNames,
      elementName = _element$meta.name;

  if (!props) {
    return props;
  }

  propNames.forEach(function (propName) {
    if (propName.charAt(0) === '$') {
      delete props[propName];
      var cleanPropName = propName.substr(1, propName.length);

      props[cleanPropName] = resolveProp(cleanPropName, element.parent, '"' + cleanPropName + '" prop requested by "' + elementName + '" can not be found.', [elementName]);
    }
  });
  return props;
};

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isActMLElement;
function isActMLElement(element) {
  return element && element.scope && element.meta;
};

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (props) {
  var api = {
    exists: function exists(propName, func) {
      if (props && props[propName]) {
        func(props[propName]);
      }
    }
  };

  return api;
};

;

},{}]},{},[2])(2)
});