(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.actml = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function getFuncName(func) {
  if (func.name) return func.name;
  var result = /^function\s+([\w\$]+)\s*\(/.exec(func.toString());

  return result ? result[1] : 'unknown';
};

var createElement = function createElement(func, props, children) {
  if (typeof func !== 'function') {
    throw new Error('ActML element expects a function. "' + func + '" given instead.');
  }
  return {
    __actml: true,
    __used: 0,
    __running: false,
    __processChildrenAutomatically: true,
    id: null,
    props: props,
    name: getFuncName(func),
    children: children,
    initialize: function initialize(id) {
      var used = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      this.id = id;
      this.__used = used;
      this.__running = false;
      this.__processChildrenAutomatically = true;
    },
    mergeProps: function mergeProps(newProps) {
      this.props = Object.assign({}, this.props, newProps);
    },
    used: function used() {
      return this.__used;
    },
    isRunning: function isRunning() {
      return this.__running;
    },
    shouldProcessChildrenAutomatically: function shouldProcessChildrenAutomatically(value) {
      if (typeof value === 'undefined') {
        return this.__processChildrenAutomatically;
      }
      this.__processChildrenAutomatically = value;
      return value;
    },
    enter: function enter() {
      this.__running = true;
      this.__processChildrenAutomatically = true;
    },
    consume: function consume() {
      return func(this.props);
    },
    out: function out() {
      this.__used += 1;
      this.__running = false;
    }
  };
};

exports.default = createElement;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createProcessor;

var _isActMLElement = require('./utils/isActMLElement');

var _isActMLElement2 = _interopRequireDefault(_isActMLElement);

var _Tree = require('./Tree');

var _Tree2 = _interopRequireDefault(_Tree);

var _usePubSub = require('./hooks/usePubSub');

var _usePubSub2 = _interopRequireDefault(_usePubSub);

var _useState = require('./hooks/useState');

var _useState2 = _interopRequireDefault(_useState);

var _useEffect = require('./hooks/useEffect');

var _useEffect2 = _interopRequireDefault(_useEffect);

var _Queue = require('./Queue');

var _Queue2 = _interopRequireDefault(_Queue);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/* eslint-disable no-use-before-define */
var CONSUME = 'CONSUME';
var PROCESS_RESULT = 'PROCESS_RESULT';
var RETURNED_ELEMENT = 'RETURNED_ELEMENT';
var HANDLE_CHILDREN = 'HANDLE_CHILDREN';
var CHILD = 'CHILD';

var isGenerator = function isGenerator(obj) {
  return obj && typeof obj['next'] === 'function';
};
var isPromise = function isPromise(obj) {
  return obj && typeof obj['then'] === 'function';
};

function createProcessor() {
  var tree = (0, _Tree2.default)();
  var currentNode = null;

  var processNode = function processNode(node) {
    currentNode = node;
    node.enter();
    node.rerun = function () {
      return processNode(node);
    };
    node.callChildren = function () {
      var _arguments = arguments;
      var children = node.element.children;

      if (children && children.length > 0) {
        var queueItemsToAdd = [];
        var _results = [];
        var childrenQueue = (0, _Queue2.default)('  ' + node.element.name + ':children');

        var _loop = function _loop(i) {
          if ((0, _isActMLElement2.default)(children[i])) {
            var _children$i;

            (_children$i = children[i]).mergeProps.apply(_children$i, _arguments);
            queueItemsToAdd.push(function () {
              return processNode(node.addChildNode(children[i]));
            });
          } else if (typeof children[i] === 'function') {
            var funcResult = children[i].apply(children, _arguments);

            if ((0, _isActMLElement2.default)(funcResult)) {
              queueItemsToAdd.push(function () {
                return processNode(node.addChildNode(funcResult));
              });
            } else {
              _results.push(funcResult);
            }
          } else {
            _results.push(children[i]);
          }
        };

        for (var i = 0; i < children.length; i++) {
          _loop(i);
        }
        queueItemsToAdd.reverse().forEach(function (func) {
          childrenQueue.prependItem(CHILD, func, function (r) {
            return _results.push(r);
          });
        });
        childrenQueue.process();
        return childrenQueue.onDone(function () {
          return _results;
        });
      }
      return null;
    };

    var results = {};
    var queue = (0, _Queue2.default)(' ' + node.element.name);

    // CONSUME
    queue.add(CONSUME, function () {
      return node.element.consume();
    }, function (result) {
      return results[CONSUME] = result;
    });

    // PROCESS_RESULT
    queue.add(PROCESS_RESULT, function () {
      var consumption = results[CONSUME];

      if ((0, _isActMLElement2.default)(consumption)) {
        queue.prependItem(RETURNED_ELEMENT, function () {
          return processNode(node.addChildNode(consumption));
        }, function (result) {
          return results[RETURNED_ELEMENT] = result;
        });
      } else if (isGenerator(consumption)) {
        var generator = consumption;

        queue.prependItem(RETURNED_ELEMENT, function () {
          return new Promise(function (generatorDone) {
            var genResult = void 0;

            (function iterate(value) {
              genResult = generator.next(value);
              if (!genResult.done) {
                if ((0, _isActMLElement2.default)(genResult.value)) {
                  var res = processNode(node.addChildNode(genResult.value));

                  if (isPromise(res)) {
                    res.then(function (r) {
                      return iterate(r);
                    });
                  } else {
                    iterate(res);
                  }
                }
              } else {
                if ((0, _isActMLElement2.default)(genResult.value)) {
                  var _res = processNode(node.addChildNode(genResult.value));

                  if (isPromise(_res)) {
                    _res.then(function (r) {
                      return generatorDone(r);
                    });
                  } else {
                    generatorDone(_res);
                  }
                } else {
                  generatorDone(genResult.value);
                }
              }
            })();
          });
        }, function (result) {
          return results[RETURNED_ELEMENT] = result;
        });
      };
    });

    // HANDLE_CHILDREN
    queue.add(HANDLE_CHILDREN, function () {
      return node.element.shouldProcessChildrenAutomatically() ? node.callChildren() : null;
    });

    // Running the queue
    queue.process();

    // Getting the result. It is either a promise if there is
    // something asynchronous or a value
    return queue.onDone(function () {
      node.out();
      return RETURNED_ELEMENT in results ? results[RETURNED_ELEMENT] : results[CONSUME];
    });
  };

  return {
    node: function node() {
      return currentNode;
    },
    run: function run(element) {
      var rootNode = tree.resolveRoot(element);

      return processNode(rootNode);
    },
    onNodeEnter: function onNodeEnter(callback) {
      tree.addNodeEnterCallback(callback);
    },
    onNodeOut: function onNodeOut(callback) {
      tree.addNodeOutCallback(callback);
    },
    onNodeRemove: function onNodeRemove(callback) {
      tree.onNodeRemove(callback);
    },
    system: function system() {
      return {
        tree: tree,
        reset: function reset() {
          currentNode = null;
          tree.reset();
          _usePubSub2.default.clear();
          _useState2.default.clear();
          _useEffect2.default.clear();
        }
      };
    }
  };
};

},{"./Queue":3,"./Tree":4,"./hooks/useEffect":6,"./hooks/usePubSub":9,"./hooks/useState":11,"./utils/isActMLElement":14}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createQueue;

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }return arr2;
  } else {
    return Array.from(arr);
  }
}

/* eslint-disable no-return-assign */
var LOGS = false;
var log = function log() {
  var _console;

  return LOGS ? (_console = console).log.apply(_console, arguments) : null;
};
var isPromise = function isPromise(obj) {
  return obj && typeof obj['then'] === 'function';
};
var createItem = function createItem(type, func) {
  var onDone = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};
  return {
    type: type,
    func: func,
    onDone: onDone
  };
};

function createQueue(context) {
  var items = [];
  var async = false;
  var running = false;
  var release = function release() {};

  return {
    add: function add(type, func, onDone) {
      log(context + ':Q: [...' + type + '] (' + (items.length + 1) + ' total)');
      items.push(createItem(type, func, onDone));
    },
    prependItem: function prependItem(type, func, onDone) {
      log(context + ':Q: [' + type + '...] (' + (items.length + 1) + ' total)');
      items = [createItem(type, func, onDone)].concat(_toConsumableArray(items));
    },
    process: function process(lastResult) {
      var _this = this;

      running = true;
      if (items.length === 0) {
        log(context + ':Q:done');
        running = false;
        release();
        return;
      }

      var item = items.shift();

      log(context + ':Q: ' + item.type + '() (' + items.length + ' left)');
      var result = item.func(lastResult);

      if (isPromise(result)) {
        async = true;
        result.then(function (asyncResult) {
          item.onDone(asyncResult);
          _this.process(asyncResult);
        }).catch(function (error) {
          release(error);
        });
      } else {
        item.onDone(result);
        this.process(result);
      }
    },
    onDone: function onDone(getResult) {
      if (async) {
        return new Promise(function (done, reject) {
          release = function release(error) {
            if (error) {
              reject(error);
            } else {
              done(getResult());
            }
          };
        });
      }
      return getResult();
    },
    isRunning: function isRunning() {
      return running;
    }
  };
};

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Tree;
/* eslint-disable no-use-before-define, no-return-assign, max-len */
var LOGS = false;
var log = function log() {
  var _console;

  return LOGS ? (_console = console).log.apply(_console, arguments) : null;
};

function Tree() {
  var onNodeEnter = [];
  var onNodeOut = [];
  var _onNodeRemove = [];
  var root = createNewNode();
  var ids = 0;

  function getId() {
    return 'a' + ++ids;
  };
  function useSameNode(node, newElement) {
    newElement.initialize(node.element.id, node.element.used());
    node.element = newElement;
    return node;
  }
  function treeDiff(oldElement, newElement) {
    if (oldElement && oldElement.name === newElement.name) {
      if (oldElement.props && newElement.props) {
        return oldElement.props.key === newElement.props.key;
      }
      return true;
    }
    return false;
  }
  function createNewNode(element, parent) {
    if (element) {
      element.initialize(getId());
    }
    return {
      element: element,
      children: [],
      parent: parent,
      cursor: 0,
      enter: function enter() {
        var _this = this;

        log('-> ' + this.element.name);
        this.element.enter();
        onNodeEnter.forEach(function (c) {
          return c(_this);
        });
      },
      out: function out() {
        var _this2 = this;

        log('<- ' + this.element.name);
        this.element.out();
        // If there're more nodes in the tree than what was processed
        if (this.cursor < this.children.length) {
          this.children.splice(this.cursor, this.children.length - this.cursor).forEach(function (removedNode) {
            return _onNodeRemove.forEach(function (c) {
              return c(removedNode);
            });
          });
        }
        this.cursor = 0;
        onNodeOut.forEach(function (c) {
          return c(_this2);
        });
      },
      addChildNode: function addChildNode(newElement) {
        var _this3 = this;

        var childNode = this.children[this.cursor];

        // using the same node
        if (childNode && treeDiff(childNode.element, newElement)) {
          this.cursor += 1;
          return useSameNode(childNode, newElement);
        }

        // creating a new node
        var newChildNode = createNewNode(newElement, this);

        if (this.children[this.cursor]) {
          _onNodeRemove.forEach(function (c) {
            return c(_this3.children[_this3.cursor]);
          });
        }
        this.children[this.cursor] = newChildNode;
        this.cursor += 1;
        return newChildNode;
      }
    };
  }

  return {
    resolveRoot: function resolveRoot(element) {
      return root = treeDiff(root.element, element) ? useSameNode(root, element) : createNewNode(element);
    },
    reset: function reset() {
      root = createNewNode();
      ids = 0;
    },
    getNumOfElements: function getNumOfElements() {
      return ids;
    },
    diagnose: function diagnose() {
      return function loopOver(node) {
        var ind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        return {
          ind: ind,
          name: node.element.name,
          used: node.element.used(),
          id: node.element.id,
          children: node.children.map(function (child) {
            return loopOver(child, ind + 1);
          })
        };
      }(root);
    },
    addNodeEnterCallback: function addNodeEnterCallback(callback) {
      onNodeEnter.push(callback);
    },
    addNodeOutCallback: function addNodeOutCallback(callback) {
      onNodeOut.push(callback);
    },
    onNodeRemove: function onNodeRemove(callback) {
      _onNodeRemove.push(callback);
    }
  };
};

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isValidHookContext = require('./utils/isValidHookContext');

var _isValidHookContext2 = _interopRequireDefault(_isValidHookContext);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var createUseChildrenHook = function createUseChildrenHook(processor) {
  return function () {
    (0, _isValidHookContext2.default)(processor);

    var node = processor.node();

    node.element.shouldProcessChildrenAutomatically(false);
    return [node.callChildren, node.element.children];
  };
};

exports.default = createUseChildrenHook;

},{"./utils/isValidHookContext":12}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fastDeepEqual = require('fast-deep-equal');

var _fastDeepEqual2 = _interopRequireDefault(_fastDeepEqual);

var _isValidHookContext = require('./utils/isValidHookContext');

var _isValidHookContext2 = _interopRequireDefault(_isValidHookContext);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/* eslint-disable no-return-assign */
var Storage = {
  elements: {},
  get: function get(element) {
    if (this.elements[element.id]) {
      return this.elements[element.id];
    }
    return this.elements[element.id] = { effects: [], consumer: 0 };
  },
  cleanUp: function cleanUp(id) {
    if (this.elements[id]) {
      delete this.elements[id];
    }
  }
};

var createEffect = function createEffect(callback, deps) {
  return {
    callback: callback,
    deps: deps
  };
};
var updateEffect = function updateEffect(effect, callback, deps) {
  effect.callback = callback;
  effect.oldDeps = effect.deps;
  effect.deps = deps;
  return effect;
};

function depsEqual(oldDeps, newDeps) {
  if (!oldDeps) return false;
  if (oldDeps.length !== newDeps.length) return false;
  return (0, _fastDeepEqual2.default)(oldDeps, newDeps);
}
function resolveEffect(node, effect) {
  var deps = effect.deps,
      oldDeps = effect.oldDeps,
      callback = effect.callback;

  if (typeof deps === 'undefined') {
    effect.cleanUp = callback();
  } else if (deps.length === 0) {
    if (node.element.used() === 1) {
      effect.cleanUp = callback();
    }
  } else {
    var areEqual = depsEqual(oldDeps, deps);

    if (!areEqual) {
      effect.cleanUp = callback();
    }
  }
}

var createUseEffectHook = function createUseEffectHook(processor) {
  processor.onNodeRemove(function (node) {
    var element = node.element;

    var storage = Storage.get(element);

    storage.effects.forEach(function (effect) {
      if (effect.cleanUp) effect.cleanUp();
    });
    Storage.cleanUp(node.element.id);
  });
  processor.onNodeOut(function (node) {
    var element = node.element;

    var storage = Storage.get(element);

    if (storage.effects.length > 0) {
      storage.effects.forEach(function (effect) {
        return resolveEffect(node, effect);
      });
    }
  });
  return function (callback, deps) {
    (0, _isValidHookContext2.default)(processor);

    var node = processor.node();
    var element = node.element;

    var storage = Storage.get(element);

    // first run
    if (element.used() === 0) {
      storage.effects.push(createEffect(callback, deps));

      // other runs
    } else {
      var index = storage.consumer;

      storage.consumer = index < storage.effects.length - 1 ? storage.consumer + 1 : 0;
      updateEffect(storage.effects[index], callback, deps);
    }
  };
};

exports.default = createUseEffectHook;

createUseEffectHook.clear = function () {
  Storage.elements = {};
};

},{"./utils/isValidHookContext":12,"fast-deep-equal":15}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isValidHookContext = require('./utils/isValidHookContext');

var _isValidHookContext2 = _interopRequireDefault(_isValidHookContext);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var createUseElementHook = function createUseElementHook(processor) {
  return function () {
    (0, _isValidHookContext2.default)(processor);

    return processor.node().element;
  };
};

exports.default = createUseElementHook;

},{"./utils/isValidHookContext":12}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isValidHookContext = require('./utils/isValidHookContext');

var _isValidHookContext2 = _interopRequireDefault(_isValidHookContext);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }return obj;
} /* eslint-disable no-return-assign */

var bridgeMethodName = function bridgeMethodName(keyword) {
  return '__request__' + keyword;
};

var resolveProduct = function resolveProduct(bridgeMethod, node, getError) {
  if (!node) {
    throw getError();
  }
  var source = void 0;

  if (node[bridgeMethod]) {
    source = node;
  } else {
    source = node.children.find(function (child) {
      return !!child[bridgeMethod];
    });
  }
  var product = source ? source[bridgeMethod]() : null;

  if (product !== null) {
    return product.value;
  }
  return resolveProduct(bridgeMethod, node.parent, getError);
};

var getNotFoundError = function getNotFoundError(keyword, node) {
  var getStack = function getStack(node) {
    var stack = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    stack.push(node.element.name);
    if (node.parent) {
      return getStack(node.parent, stack);
    }
    return stack;
  };

  return new Error('"' + keyword + '" prop requested by "' + node.element.name + '" can not be found.\n\nStack:\n' + getStack(node).reverse().map(function (name) {
    return '  <' + name + '>';
  }).join('\n'));
};

var createUseProductHook = function createUseProductHook(processor) {
  processor.onNodeEnter(function (node) {
    var element = node.element;
    var props = element.props;

    var propNames = props ? Object.keys(props) : [];

    propNames.forEach(function (propName) {
      if (propName.charAt(0) === '$') {
        var keyword = propName.substr(1, propName.length);
        var productValue = resolveProduct(bridgeMethodName(keyword), node.parent, function () {
          return getNotFoundError(keyword, node);
        });

        element.mergeProps(_defineProperty({}, keyword, productValue));
      } else if (propName === 'exports') {
        node[bridgeMethodName(props[propName])] = function () {
          return { value: node.__product };
        };
      }
    });
  });

  return function (value) {
    (0, _isValidHookContext2.default)(processor);
    var node = processor.node();

    node.__product = value;
    return [function (newValue) {
      return node.__product = newValue;
    }];
  };
};

exports.default = createUseProductHook;

},{"./utils/isValidHookContext":12}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

exports.default = createUsePubSubHook;

var _isValidHookContext = require('./utils/isValidHookContext');

var _isValidHookContext2 = _interopRequireDefault(_isValidHookContext);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var subscribers = {};

function createSubscribeElement(subscribe, useChildren) {
  return function (_ref) {
    var type = _ref.type;

    var _useChildren = useChildren(),
        _useChildren2 = _slicedToArray(_useChildren, 1),
        children = _useChildren2[0];

    subscribe(type, function (payload) {
      return children({ payload: payload });
    });
  };
};
function createPublishElement(publish) {
  return function (_ref2) {
    var type = _ref2.type,
        payload = _ref2.payload;

    publish(type, payload);
  };
}

var subscribe = function subscribe(element, type, callback) {
  if (!subscribers[type]) subscribers[type] = {};
  subscribers[type][element.id] = callback;
  return function () {
    delete subscribers[type][element.id];
  };
};
var publish = function publish(type, payload) {
  if (!subscribers[type]) return;
  Object.keys(subscribers[type]).forEach(function (id) {
    subscribers[type][id](payload);
  });
};

function createUsePubSubHook(processor, useChildren) {
  processor.onNodeRemove(function (node) {
    Object.keys(subscribers).forEach(function (type) {
      if (subscribers[type][node.element.id]) {
        delete subscribers[type][node.element.id];
      }
    });
  });
  return function (scopedElement) {
    (0, _isValidHookContext2.default)(processor);

    var node = processor.node();
    var el = scopedElement || node.element;
    var subscribeFunc = function subscribeFunc() {
      for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
        params[_key] = arguments[_key];
      }

      return subscribe.apply(undefined, [el].concat(params));
    };
    var publishFunc = function publishFunc() {
      return publish.apply(undefined, arguments);
    };

    return {
      subscribe: subscribeFunc,
      publish: publishFunc,
      subscribers: subscribers,
      Subscribe: createSubscribeElement(subscribeFunc, useChildren),
      Publish: createPublishElement(publishFunc)
    };
  };
}

createUsePubSubHook.clear = function () {
  subscribers = {};
};

},{"./utils/isValidHookContext":12}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

exports.default = createUseReducerHook;

function _objectWithoutProperties(obj, keys) {
  var target = {};for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;target[i] = obj[i];
  }return target;
}

function createDispatchElement(dispatch) {
  return function (_ref) {
    var action = _ref.action,
        propsToAction = _ref.propsToAction,
        rest = _objectWithoutProperties(_ref, ['action', 'propsToAction']);

    if (action) {
      dispatch(action);
    } else if (propsToAction) {
      dispatch(propsToAction(rest));
    } else {
      throw new Error('<Dispatch> expects "action" or "propsToAction" prop.');
    }
  };
}

function createUseReducerHook(useState) {
  return function (reducer, initialState) {
    var _useState = useState(initialState),
        _useState2 = _slicedToArray(_useState, 3),
        state = _useState2[0],
        setState = _useState2[1],
        getState = _useState2[2];

    var dispatch = function dispatch(action) {
      return setState(reducer(getState(), action));
    };

    return [state, dispatch, createDispatchElement(dispatch), // <Dispatch>
    function () {
      return getState();
    } // <GetState>
    ];
  };
}

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createUseStateHook;

var _isValidHookContext = require('./utils/isValidHookContext');

var _isValidHookContext2 = _interopRequireDefault(_isValidHookContext);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var Storage = {
  elements: {},
  get: function get(element) {
    if (this.elements[element.id]) {
      return this.elements[element.id];
    }
    return this.elements[element.id] = { states: [], consumer: 0 };
  },
  cleanUp: function cleanUp(id) {
    if (this.elements[id]) {
      delete this.elements[id];
    }
  }
}; /* eslint-disable no-return-assign */
function createUseStateHook(processor) {
  processor.onNodeRemove(function (node) {
    return Storage.cleanUp(node.element.id);
  });
  return function (initialState) {
    (0, _isValidHookContext2.default)(processor);

    var node = processor.node();
    var element = node.element;

    var storage = Storage.get(element);

    var index = void 0;

    // first run
    if (element.used() === 0) {
      storage.states.push(initialState);
      index = storage.states.length - 1;

      // other runs
    } else {
      index = storage.consumer;
      storage.consumer = index < storage.states.length - 1 ? storage.consumer + 1 : 0;
    }

    return [storage.states[index], function (newState) {
      storage.states[index] = newState;
      if (!element.isRunning()) {
        node.rerun();
      }
      return newState;
    }, function () {
      return storage.states[index];
    }];
  };
}

createUseStateHook.clear = function () {
  Storage.elements = {};
};

},{"./utils/isValidHookContext":12}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isValidHookContext;
function isValidHookContext(processor) {
  if (!processor) {
    throw new Error('Something terribly wrong happened. The hook factory function is called without a processor.');
  }
  if (!processor.node()) {
    throw new Error('Hooks must be called in the context of an ActML element.');
  }
};

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createRuntime = createRuntime;

var _Processor = require('./Processor');

var _Processor2 = _interopRequireDefault(_Processor);

var _isActMLElement = require('./utils/isActMLElement');

var _isActMLElement2 = _interopRequireDefault(_isActMLElement);

var _ActElement = require('./ActElement');

var _ActElement2 = _interopRequireDefault(_ActElement);

var _useChildren = require('./hooks/useChildren');

var _useChildren2 = _interopRequireDefault(_useChildren);

var _useElement = require('./hooks/useElement');

var _useElement2 = _interopRequireDefault(_useElement);

var _useProduct = require('./hooks/useProduct');

var _useProduct2 = _interopRequireDefault(_useProduct);

var _usePubSub = require('./hooks/usePubSub');

var _usePubSub2 = _interopRequireDefault(_usePubSub);

var _useState = require('./hooks/useState');

var _useState2 = _interopRequireDefault(_useState);

var _useReducer = require('./hooks/useReducer');

var _useReducer2 = _interopRequireDefault(_useReducer);

var _useEffect = require('./hooks/useEffect');

var _useEffect2 = _interopRequireDefault(_useEffect);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function createRuntime() {
  var processor = (0, _Processor2.default)();

  function A(func, props) {
    for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      children[_key - 2] = arguments[_key];
    }

    return (0, _ActElement2.default)(func, props, children);
  }
  function run(element) {
    if (!(0, _isActMLElement2.default)(element)) {
      throw new Error('ActML element expected. Instead ' + element.toString() + ' passed.');
    }
    return processor.run(element);
  }
  var Fragment = function Fragment() {};
  var useChildren = (0, _useChildren2.default)(processor);
  var useElement = (0, _useElement2.default)(processor);
  var useState = (0, _useState2.default)(processor);
  var useProduct = (0, _useProduct2.default)(processor, useState);
  var usePubSub = (0, _usePubSub2.default)(processor, useChildren);
  var useReducer = (0, _useReducer2.default)(useState);
  var useEffect = (0, _useEffect2.default)(processor);

  return {
    A: A,
    run: run,
    Fragment: Fragment,
    processor: processor,
    useChildren: useChildren,
    useElement: useElement,
    useProduct: useProduct,
    usePubSub: usePubSub,
    useState: useState,
    useReducer: useReducer,
    useEffect: useEffect
  };
}

var runtime = createRuntime();

module.exports = runtime;
module.exports.createRuntime = createRuntime();

},{"./ActElement":1,"./Processor":2,"./hooks/useChildren":5,"./hooks/useEffect":6,"./hooks/useElement":7,"./hooks/useProduct":8,"./hooks/usePubSub":9,"./hooks/useReducer":10,"./hooks/useState":11,"./utils/isActMLElement":14}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isActMLElement;
function isActMLElement(element) {
  return element && element.__actml === true;
};

},{}],15:[function(require,module,exports){
'use strict';

var isArray = Array.isArray;
var keyList = Object.keys;
var hasProp = Object.prototype.hasOwnProperty;

module.exports = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    var arrA = isArray(a)
      , arrB = isArray(b)
      , i
      , length
      , key;

    if (arrA && arrB) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }

    if (arrA != arrB) return false;

    var dateA = a instanceof Date
      , dateB = b instanceof Date;
    if (dateA != dateB) return false;
    if (dateA && dateB) return a.getTime() == b.getTime();

    var regexpA = a instanceof RegExp
      , regexpB = b instanceof RegExp;
    if (regexpA != regexpB) return false;
    if (regexpA && regexpB) return a.toString() == b.toString();

    var keys = keyList(a);
    length = keys.length;

    if (length !== keyList(b).length)
      return false;

    for (i = length; i-- !== 0;)
      if (!hasProp.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  return a!==a && b!==b;
};

},{}]},{},[13])(13)
});
