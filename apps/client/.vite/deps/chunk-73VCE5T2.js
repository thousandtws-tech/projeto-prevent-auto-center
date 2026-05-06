import {
  _extends
} from "./chunk-HQ6ZTAWL.js";
import {
  require_react
} from "./chunk-OC5S6P4L.js";
import {
  __commonJS,
  __publicField,
  __toESM
} from "./chunk-SNAQBZPT.js";

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js
var require_use_sync_external_store_shim_development = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js"(exports) {
    "use strict";
    (function() {
      function is2(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      function useSyncExternalStore$2(subscribe, getSnapshot) {
        didWarnOld18Alpha || void 0 === React6.startTransition || (didWarnOld18Alpha = true, console.error(
          "You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."
        ));
        var value = getSnapshot();
        if (!didWarnUncachedGetSnapshot) {
          var cachedValue = getSnapshot();
          objectIs(value, cachedValue) || (console.error(
            "The result of getSnapshot should be cached to avoid an infinite loop"
          ), didWarnUncachedGetSnapshot = true);
        }
        cachedValue = useState({
          inst: { value, getSnapshot }
        });
        var inst = cachedValue[0].inst, forceUpdate = cachedValue[1];
        useLayoutEffect(
          function() {
            inst.value = value;
            inst.getSnapshot = getSnapshot;
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          },
          [subscribe, value, getSnapshot]
        );
        useEffect2(
          function() {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            return subscribe(function() {
              checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            });
          },
          [subscribe]
        );
        useDebugValue(value);
        return value;
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch (error) {
          return true;
        }
      }
      function useSyncExternalStore$1(subscribe, getSnapshot) {
        return getSnapshot();
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React6 = require_react(), objectIs = "function" === typeof Object.is ? Object.is : is2, useState = React6.useState, useEffect2 = React6.useEffect, useLayoutEffect = React6.useLayoutEffect, useDebugValue = React6.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
      exports.useSyncExternalStore = void 0 !== React6.useSyncExternalStore ? React6.useSyncExternalStore : shim;
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/use-sync-external-store/shim/index.js
var require_shim = __commonJS({
  "node_modules/use-sync-external-store/shim/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_use_sync_external_store_shim_development();
    }
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
var require_with_selector_development = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js"(exports) {
    "use strict";
    (function() {
      function is2(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React6 = require_react(), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is2, useSyncExternalStore2 = shim.useSyncExternalStore, useRef2 = React6.useRef, useEffect2 = React6.useEffect, useMemo = React6.useMemo, useDebugValue = React6.useDebugValue;
      exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
        var instRef = useRef2(null);
        if (null === instRef.current) {
          var inst = { hasValue: false, value: null };
          instRef.current = inst;
        } else inst = instRef.current;
        instRef = useMemo(
          function() {
            function memoizedSelector(nextSnapshot) {
              if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;
                nextSnapshot = selector(nextSnapshot);
                if (void 0 !== isEqual && inst.hasValue) {
                  var currentSelection = inst.value;
                  if (isEqual(currentSelection, nextSnapshot))
                    return memoizedSelection = currentSelection;
                }
                return memoizedSelection = nextSnapshot;
              }
              currentSelection = memoizedSelection;
              if (objectIs(memoizedSnapshot, nextSnapshot))
                return currentSelection;
              var nextSelection = selector(nextSnapshot);
              if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
                return memoizedSnapshot = nextSnapshot, currentSelection;
              memoizedSnapshot = nextSnapshot;
              return memoizedSelection = nextSelection;
            }
            var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
            return [
              function() {
                return memoizedSelector(getSnapshot());
              },
              null === maybeGetServerSnapshot ? void 0 : function() {
                return memoizedSelector(maybeGetServerSnapshot());
              }
            ];
          },
          [getSnapshot, getServerSnapshot, selector, isEqual]
        );
        var value = useSyncExternalStore2(subscribe, instRef[0], instRef[1]);
        useEffect2(
          function() {
            inst.hasValue = true;
            inst.value = value;
          },
          [value]
        );
        useDebugValue(value);
        return value;
      };
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = __commonJS({
  "node_modules/use-sync-external-store/shim/with-selector.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_with_selector_development();
    }
  }
});

// node_modules/@mui/x-internals/esm/reactMajor/index.js
var React = __toESM(require_react(), 1);
var reactMajor_default = parseInt(React.version, 10);

// node_modules/@mui/x-internals/node_modules/@mui/utils/esm/useLazyRef/useLazyRef.js
var React2 = __toESM(require_react(), 1);
var UNINITIALIZED = {};
function useLazyRef(init, initArg) {
  const ref = React2.useRef(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg);
  }
  return ref;
}

// node_modules/@mui/x-internals/node_modules/@mui/utils/esm/useOnMount/useOnMount.js
var React3 = __toESM(require_react(), 1);
var EMPTY = [];
function useOnMount(fn) {
  React3.useEffect(fn, EMPTY);
}

// node_modules/@mui/x-internals/esm/store/useStoreEffect.js
var noop = () => {
};
function useStoreEffect(store, selector, effect) {
  const instance = useLazyRef(initialize, {
    store,
    selector
  }).current;
  instance.effect = effect;
  useOnMount(instance.onMount);
}
function initialize(params) {
  const {
    store,
    selector
  } = params;
  let previousState = selector(store.state);
  const instance = {
    effect: noop,
    dispose: null,
    // We want a single subscription done right away and cleared on unmount only,
    // but React triggers `useOnMount` multiple times in dev, so we need to manage
    // the subscription anyway.
    subscribe: () => {
      instance.dispose ?? (instance.dispose = store.subscribe((state) => {
        const nextState = selector(state);
        if (!Object.is(previousState, nextState)) {
          const prev = previousState;
          previousState = nextState;
          instance.effect(prev, nextState);
        }
      }));
    },
    onMount: () => {
      instance.subscribe();
      return () => {
        var _a;
        (_a = instance.dispose) == null ? void 0 : _a.call(instance);
        instance.dispose = null;
      };
    }
  };
  instance.subscribe();
  return instance;
}

// node_modules/reselect/dist/reselect.mjs
var runIdentityFunctionCheck = (resultFunc, inputSelectorsResults, outputSelectorResult) => {
  if (inputSelectorsResults.length === 1 && inputSelectorsResults[0] === outputSelectorResult) {
    let isInputSameAsOutput = false;
    try {
      const emptyObject = {};
      if (resultFunc(emptyObject) === emptyObject)
        isInputSameAsOutput = true;
    } catch {
    }
    if (isInputSameAsOutput) {
      let stack = void 0;
      try {
        throw new Error();
      } catch (e) {
        ;
        ({ stack } = e);
      }
      console.warn(
        "The result function returned its own inputs without modification. e.g\n`createSelector([state => state.todos], todos => todos)`\nThis could lead to inefficient memoization and unnecessary re-renders.\nEnsure transformation logic is in the result function, and extraction logic is in the input selectors.",
        { stack }
      );
    }
  }
};
var runInputStabilityCheck = (inputSelectorResultsObject, options, inputSelectorArgs) => {
  const { memoize, memoizeOptions } = options;
  const { inputSelectorResults, inputSelectorResultsCopy } = inputSelectorResultsObject;
  const createAnEmptyObject = memoize(() => ({}), ...memoizeOptions);
  const areInputSelectorResultsEqual = createAnEmptyObject.apply(null, inputSelectorResults) === createAnEmptyObject.apply(null, inputSelectorResultsCopy);
  if (!areInputSelectorResultsEqual) {
    let stack = void 0;
    try {
      throw new Error();
    } catch (e) {
      ;
      ({ stack } = e);
    }
    console.warn(
      "An input selector returned a different result when passed same arguments.\nThis means your output selector will likely run more frequently than intended.\nAvoid returning a new reference inside your input selector, e.g.\n`createSelector([state => state.todos.map(todo => todo.id)], todoIds => todoIds.length)`",
      {
        arguments: inputSelectorArgs,
        firstInputs: inputSelectorResults,
        secondInputs: inputSelectorResultsCopy,
        stack
      }
    );
  }
};
var globalDevModeChecks = {
  inputStabilityCheck: "once",
  identityFunctionCheck: "once"
};
var NOT_FOUND = Symbol("NOT_FOUND");
function assertIsFunction(func, errorMessage = `expected a function, instead received ${typeof func}`) {
  if (typeof func !== "function") {
    throw new TypeError(errorMessage);
  }
}
function assertIsObject(object, errorMessage = `expected an object, instead received ${typeof object}`) {
  if (typeof object !== "object") {
    throw new TypeError(errorMessage);
  }
}
function assertIsArrayOfFunctions(array, errorMessage = `expected all items to be functions, instead received the following types: `) {
  if (!array.every((item) => typeof item === "function")) {
    const itemTypes = array.map(
      (item) => typeof item === "function" ? `function ${item.name || "unnamed"}()` : typeof item
    ).join(", ");
    throw new TypeError(`${errorMessage}[${itemTypes}]`);
  }
}
var ensureIsArray = (item) => {
  return Array.isArray(item) ? item : [item];
};
function getDependencies(createSelectorArgs) {
  const dependencies = Array.isArray(createSelectorArgs[0]) ? createSelectorArgs[0] : createSelectorArgs;
  assertIsArrayOfFunctions(
    dependencies,
    `createSelector expects all input-selectors to be functions, but received the following types: `
  );
  return dependencies;
}
function collectInputSelectorResults(dependencies, inputSelectorArgs) {
  const inputSelectorResults = [];
  const { length } = dependencies;
  for (let i = 0; i < length; i++) {
    inputSelectorResults.push(dependencies[i].apply(null, inputSelectorArgs));
  }
  return inputSelectorResults;
}
var getDevModeChecksExecutionInfo = (firstRun, devModeChecks) => {
  const { identityFunctionCheck, inputStabilityCheck } = {
    ...globalDevModeChecks,
    ...devModeChecks
  };
  return {
    identityFunctionCheck: {
      shouldRun: identityFunctionCheck === "always" || identityFunctionCheck === "once" && firstRun,
      run: runIdentityFunctionCheck
    },
    inputStabilityCheck: {
      shouldRun: inputStabilityCheck === "always" || inputStabilityCheck === "once" && firstRun,
      run: runInputStabilityCheck
    }
  };
};
var REDUX_PROXY_LABEL = Symbol();
var proto = Object.getPrototypeOf({});
function createSingletonCache(equals) {
  let entry;
  return {
    get(key) {
      if (entry && equals(entry.key, key)) {
        return entry.value;
      }
      return NOT_FOUND;
    },
    put(key, value) {
      entry = { key, value };
    },
    getEntries() {
      return entry ? [entry] : [];
    },
    clear() {
      entry = void 0;
    }
  };
}
function createLruCache(maxSize, equals) {
  let entries = [];
  function get(key) {
    const cacheIndex = entries.findIndex((entry) => equals(key, entry.key));
    if (cacheIndex > -1) {
      const entry = entries[cacheIndex];
      if (cacheIndex > 0) {
        entries.splice(cacheIndex, 1);
        entries.unshift(entry);
      }
      return entry.value;
    }
    return NOT_FOUND;
  }
  function put(key, value) {
    if (get(key) === NOT_FOUND) {
      entries.unshift({ key, value });
      if (entries.length > maxSize) {
        entries.pop();
      }
    }
  }
  function getEntries() {
    return entries;
  }
  function clear() {
    entries = [];
  }
  return { get, put, getEntries, clear };
}
var referenceEqualityCheck = (a, b) => a === b;
function createCacheKeyComparator(equalityCheck) {
  return function areArgumentsShallowlyEqual(prev, next) {
    if (prev === null || next === null || prev.length !== next.length) {
      return false;
    }
    const { length } = prev;
    for (let i = 0; i < length; i++) {
      if (!equalityCheck(prev[i], next[i])) {
        return false;
      }
    }
    return true;
  };
}
function lruMemoize(func, equalityCheckOrOptions) {
  const providedOptions = typeof equalityCheckOrOptions === "object" ? equalityCheckOrOptions : { equalityCheck: equalityCheckOrOptions };
  const {
    equalityCheck = referenceEqualityCheck,
    maxSize = 1,
    resultEqualityCheck
  } = providedOptions;
  const comparator = createCacheKeyComparator(equalityCheck);
  let resultsCount = 0;
  const cache = maxSize <= 1 ? createSingletonCache(comparator) : createLruCache(maxSize, comparator);
  function memoized() {
    let value = cache.get(arguments);
    if (value === NOT_FOUND) {
      value = func.apply(null, arguments);
      resultsCount++;
      if (resultEqualityCheck) {
        const entries = cache.getEntries();
        const matchingEntry = entries.find(
          (entry) => resultEqualityCheck(entry.value, value)
        );
        if (matchingEntry) {
          value = matchingEntry.value;
          resultsCount !== 0 && resultsCount--;
        }
      }
      cache.put(arguments, value);
    }
    return value;
  }
  memoized.clearCache = () => {
    cache.clear();
    memoized.resetResultsCount();
  };
  memoized.resultsCount = () => resultsCount;
  memoized.resetResultsCount = () => {
    resultsCount = 0;
  };
  return memoized;
}
var StrongRef = class {
  constructor(value) {
    this.value = value;
  }
  deref() {
    return this.value;
  }
};
var Ref = typeof WeakRef !== "undefined" ? WeakRef : StrongRef;
var UNTERMINATED = 0;
var TERMINATED = 1;
function createCacheNode() {
  return {
    s: UNTERMINATED,
    v: void 0,
    o: null,
    p: null
  };
}
function weakMapMemoize(func, options = {}) {
  let fnNode = createCacheNode();
  const { resultEqualityCheck } = options;
  let lastResult;
  let resultsCount = 0;
  function memoized() {
    var _a;
    let cacheNode = fnNode;
    const { length } = arguments;
    for (let i = 0, l = length; i < l; i++) {
      const arg = arguments[i];
      if (typeof arg === "function" || typeof arg === "object" && arg !== null) {
        let objectCache = cacheNode.o;
        if (objectCache === null) {
          cacheNode.o = objectCache = /* @__PURE__ */ new WeakMap();
        }
        const objectNode = objectCache.get(arg);
        if (objectNode === void 0) {
          cacheNode = createCacheNode();
          objectCache.set(arg, cacheNode);
        } else {
          cacheNode = objectNode;
        }
      } else {
        let primitiveCache = cacheNode.p;
        if (primitiveCache === null) {
          cacheNode.p = primitiveCache = /* @__PURE__ */ new Map();
        }
        const primitiveNode = primitiveCache.get(arg);
        if (primitiveNode === void 0) {
          cacheNode = createCacheNode();
          primitiveCache.set(arg, cacheNode);
        } else {
          cacheNode = primitiveNode;
        }
      }
    }
    const terminatedNode = cacheNode;
    let result;
    if (cacheNode.s === TERMINATED) {
      result = cacheNode.v;
    } else {
      result = func.apply(null, arguments);
      resultsCount++;
      if (resultEqualityCheck) {
        const lastResultValue = ((_a = lastResult == null ? void 0 : lastResult.deref) == null ? void 0 : _a.call(lastResult)) ?? lastResult;
        if (lastResultValue != null && resultEqualityCheck(lastResultValue, result)) {
          result = lastResultValue;
          resultsCount !== 0 && resultsCount--;
        }
        const needsWeakRef = typeof result === "object" && result !== null || typeof result === "function";
        lastResult = needsWeakRef ? new Ref(result) : result;
      }
    }
    terminatedNode.s = TERMINATED;
    terminatedNode.v = result;
    return result;
  }
  memoized.clearCache = () => {
    fnNode = createCacheNode();
    memoized.resetResultsCount();
  };
  memoized.resultsCount = () => resultsCount;
  memoized.resetResultsCount = () => {
    resultsCount = 0;
  };
  return memoized;
}
function createSelectorCreator(memoizeOrOptions, ...memoizeOptionsFromArgs) {
  const createSelectorCreatorOptions = typeof memoizeOrOptions === "function" ? {
    memoize: memoizeOrOptions,
    memoizeOptions: memoizeOptionsFromArgs
  } : memoizeOrOptions;
  const createSelector22 = (...createSelectorArgs) => {
    let recomputations = 0;
    let dependencyRecomputations = 0;
    let lastResult;
    let directlyPassedOptions = {};
    let resultFunc = createSelectorArgs.pop();
    if (typeof resultFunc === "object") {
      directlyPassedOptions = resultFunc;
      resultFunc = createSelectorArgs.pop();
    }
    assertIsFunction(
      resultFunc,
      `createSelector expects an output function after the inputs, but received: [${typeof resultFunc}]`
    );
    const combinedOptions = {
      ...createSelectorCreatorOptions,
      ...directlyPassedOptions
    };
    const {
      memoize,
      memoizeOptions = [],
      argsMemoize = weakMapMemoize,
      argsMemoizeOptions = [],
      devModeChecks = {}
    } = combinedOptions;
    const finalMemoizeOptions = ensureIsArray(memoizeOptions);
    const finalArgsMemoizeOptions = ensureIsArray(argsMemoizeOptions);
    const dependencies = getDependencies(createSelectorArgs);
    const memoizedResultFunc = memoize(function recomputationWrapper() {
      recomputations++;
      return resultFunc.apply(
        null,
        arguments
      );
    }, ...finalMemoizeOptions);
    let firstRun = true;
    const selector = argsMemoize(function dependenciesChecker() {
      dependencyRecomputations++;
      const inputSelectorResults = collectInputSelectorResults(
        dependencies,
        arguments
      );
      lastResult = memoizedResultFunc.apply(null, inputSelectorResults);
      if (true) {
        const { identityFunctionCheck, inputStabilityCheck } = getDevModeChecksExecutionInfo(firstRun, devModeChecks);
        if (identityFunctionCheck.shouldRun) {
          identityFunctionCheck.run(
            resultFunc,
            inputSelectorResults,
            lastResult
          );
        }
        if (inputStabilityCheck.shouldRun) {
          const inputSelectorResultsCopy = collectInputSelectorResults(
            dependencies,
            arguments
          );
          inputStabilityCheck.run(
            { inputSelectorResults, inputSelectorResultsCopy },
            { memoize, memoizeOptions: finalMemoizeOptions },
            arguments
          );
        }
        if (firstRun)
          firstRun = false;
      }
      return lastResult;
    }, ...finalArgsMemoizeOptions);
    return Object.assign(selector, {
      resultFunc,
      memoizedResultFunc,
      dependencies,
      dependencyRecomputations: () => dependencyRecomputations,
      resetDependencyRecomputations: () => {
        dependencyRecomputations = 0;
      },
      lastResult: () => lastResult,
      recomputations: () => recomputations,
      resetRecomputations: () => {
        recomputations = 0;
      },
      memoize,
      argsMemoize
    });
  };
  Object.assign(createSelector22, {
    withTypes: () => createSelector22
  });
  return createSelector22;
}
var createSelector = createSelectorCreator(weakMapMemoize);
var createStructuredSelector = Object.assign(
  (inputSelectorsObject, selectorCreator = createSelector) => {
    assertIsObject(
      inputSelectorsObject,
      `createStructuredSelector expects first argument to be an object where each property is a selector, instead received a ${typeof inputSelectorsObject}`
    );
    const inputSelectorKeys = Object.keys(inputSelectorsObject);
    const dependencies = inputSelectorKeys.map(
      (key) => inputSelectorsObject[key]
    );
    const structuredSelector = selectorCreator(
      dependencies,
      (...inputSelectorResults) => {
        return inputSelectorResults.reduce((composition, value, index) => {
          composition[inputSelectorKeys[index]] = value;
          return composition;
        }, {});
      }
    );
    return structuredSelector;
  },
  { withTypes: () => createStructuredSelector }
);

// node_modules/@mui/x-internals/esm/store/createSelector.js
var reselectCreateSelector = createSelectorCreator({
  memoize: lruMemoize,
  memoizeOptions: {
    maxSize: 1,
    equalityCheck: Object.is
  }
});
var createSelector2 = (a, b, c, d, e, f, g, h, ...other) => {
  if (other.length > 0) {
    throw new Error("Unsupported number of selectors");
  }
  let selector;
  if (a && b && c && d && e && f && g && h) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      const ve = e(state, a1, a2, a3);
      const vf = f(state, a1, a2, a3);
      const vg = g(state, a1, a2, a3);
      return h(va, vb, vc, vd, ve, vf, vg, a1, a2, a3);
    };
  } else if (a && b && c && d && e && f && g) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      const ve = e(state, a1, a2, a3);
      const vf = f(state, a1, a2, a3);
      return g(va, vb, vc, vd, ve, vf, a1, a2, a3);
    };
  } else if (a && b && c && d && e && f) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      const ve = e(state, a1, a2, a3);
      return f(va, vb, vc, vd, ve, a1, a2, a3);
    };
  } else if (a && b && c && d && e) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      return e(va, vb, vc, vd, a1, a2, a3);
    };
  } else if (a && b && c && d) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      return d(va, vb, vc, a1, a2, a3);
    };
  } else if (a && b && c) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      return c(va, vb, a1, a2, a3);
    };
  } else if (a && b) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      return b(va, a1, a2, a3);
    };
  } else if (a) {
    selector = a;
  } else {
    throw new Error("Missing arguments");
  }
  return selector;
};
var createSelectorMemoizedWithOptions = (options) => (...inputs) => {
  const cache = /* @__PURE__ */ new WeakMap();
  let nextCacheId = 1;
  const combiner = inputs[inputs.length - 1];
  const nSelectors = inputs.length - 1 || 1;
  const argsLength = Math.max(combiner.length - nSelectors, 0);
  if (argsLength > 3) {
    throw new Error("Unsupported number of arguments");
  }
  const selector = (state, a1, a2, a3) => {
    let cacheKey = state.__cacheKey__;
    if (!cacheKey) {
      cacheKey = {
        id: nextCacheId
      };
      state.__cacheKey__ = cacheKey;
      nextCacheId += 1;
    }
    let fn = cache.get(cacheKey);
    if (!fn) {
      const selectors = inputs.length === 1 ? [(x) => x, combiner] : inputs;
      let reselectArgs = inputs;
      const selectorArgs = [void 0, void 0, void 0];
      switch (argsLength) {
        case 0:
          break;
        case 1: {
          reselectArgs = [...selectors.slice(0, -1), () => selectorArgs[0], combiner];
          break;
        }
        case 2: {
          reselectArgs = [...selectors.slice(0, -1), () => selectorArgs[0], () => selectorArgs[1], combiner];
          break;
        }
        case 3: {
          reselectArgs = [...selectors.slice(0, -1), () => selectorArgs[0], () => selectorArgs[1], () => selectorArgs[2], combiner];
          break;
        }
        default:
          throw new Error("Unsupported number of arguments");
      }
      if (options) {
        reselectArgs = [...reselectArgs, options];
      }
      fn = reselectCreateSelector(...reselectArgs);
      fn.selectorArgs = selectorArgs;
      cache.set(cacheKey, fn);
    }
    switch (argsLength) {
      case 3:
        fn.selectorArgs[2] = a3;
      case 2:
        fn.selectorArgs[1] = a2;
      case 1:
        fn.selectorArgs[0] = a1;
      case 0:
      default:
    }
    switch (argsLength) {
      case 0:
        return fn(state);
      case 1:
        return fn(state, a1);
      case 2:
        return fn(state, a1, a2);
      case 3:
        return fn(state, a1, a2, a3);
      default:
        throw new Error("unreachable");
    }
  };
  return selector;
};
var createSelectorMemoized = createSelectorMemoizedWithOptions();

// node_modules/@mui/x-internals/esm/store/useStore.js
var React4 = __toESM(require_react(), 1);
var import_shim = __toESM(require_shim(), 1);
var import_with_selector = __toESM(require_with_selector(), 1);
var canUseRawUseSyncExternalStore = reactMajor_default >= 19;
var useStoreImplementation = canUseRawUseSyncExternalStore ? useStoreR19 : useStoreLegacy;
function useStore(store, selector, a1, a2, a3) {
  return useStoreImplementation(store, selector, a1, a2, a3);
}
function useStoreR19(store, selector, a1, a2, a3) {
  const getSelection = React4.useCallback(() => selector(store.getSnapshot(), a1, a2, a3), [store, selector, a1, a2, a3]);
  return (0, import_shim.useSyncExternalStore)(store.subscribe, getSelection, getSelection);
}
function useStoreLegacy(store, selector, a1, a2, a3) {
  return (0, import_with_selector.useSyncExternalStoreWithSelector)(store.subscribe, store.getSnapshot, store.getSnapshot, (state) => selector(state, a1, a2, a3));
}

// node_modules/@mui/x-internals/esm/store/Store.js
var Store = class _Store {
  constructor(state) {
    __publicField(this, "subscribe", (fn) => {
      this.listeners.add(fn);
      return () => {
        this.listeners.delete(fn);
      };
    });
    /**
     * Returns the current state snapshot. Meant for usage with `useSyncExternalStore`.
     * If you want to access the state, use the `state` property instead.
     */
    __publicField(this, "getSnapshot", () => {
      return this.state;
    });
    __publicField(this, "use", /* @__PURE__ */ (() => (selector, a1, a2, a3) => {
      return useStore(this, selector, a1, a2, a3);
    })());
    this.state = state;
    this.listeners = /* @__PURE__ */ new Set();
    this.updateTick = 0;
  }
  // HACK: `any` fixes adding listeners that accept partial state.
  // Internal state to handle recursive `setState()` calls
  static create(state) {
    return new _Store(state);
  }
  setState(newState) {
    this.state = newState;
    this.updateTick += 1;
    const currentTick = this.updateTick;
    const it = this.listeners.values();
    let result;
    while (result = it.next(), !result.done) {
      if (currentTick !== this.updateTick) {
        return;
      }
      const listener = result.value;
      listener(newState);
    }
  }
  update(changes) {
    for (const key in changes) {
      if (!Object.is(this.state[key], changes[key])) {
        this.setState(_extends({}, this.state, changes));
        return;
      }
    }
  }
  set(key, value) {
    if (!Object.is(this.state[key], value)) {
      this.setState(_extends({}, this.state, {
        [key]: value
      }));
    }
  }
};

// node_modules/@mui/x-internals/esm/warning/warning.js
var warnedOnceCache = /* @__PURE__ */ new Set();
function warnOnce(message, gravity = "warning") {
  if (false) {
    return;
  }
  const cleanMessage = Array.isArray(message) ? message.join("\n") : message;
  if (!warnedOnceCache.has(cleanMessage)) {
    warnedOnceCache.add(cleanMessage);
    if (gravity === "error") {
      console.error(cleanMessage);
    } else {
      console.warn(cleanMessage);
    }
  }
}

// node_modules/@mui/x-internals/esm/fastObjectShallowCompare/fastObjectShallowCompare.js
var is = Object.is;
function fastObjectShallowCompare(a, b) {
  if (a === b) {
    return true;
  }
  if (!(a instanceof Object) || !(b instanceof Object)) {
    return false;
  }
  let aLength = 0;
  let bLength = 0;
  for (const key in a) {
    aLength += 1;
    if (!is(a[key], b[key])) {
      return false;
    }
    if (!(key in b)) {
      return false;
    }
  }
  for (const _ in b) {
    bLength += 1;
  }
  return aLength === bLength;
}

// node_modules/@mui/x-internals/esm/useComponentRenderer/useComponentRenderer.js
var React5 = __toESM(require_react(), 1);
function useComponentRenderer(defaultElement, render, props, state = {}) {
  if (typeof render === "function") {
    return render(props, state);
  }
  if (render) {
    if (render.props.className) {
      props.className = mergeClassNames(render.props.className, props.className);
    }
    if (render.props.style || props.style) {
      props.style = _extends({}, props.style, render.props.style);
    }
    return React5.cloneElement(render, props);
  }
  return React5.createElement(defaultElement, props);
}
function mergeClassNames(className, otherClassName) {
  if (!className || !otherClassName) {
    return className || otherClassName;
  }
  return `${className} ${otherClassName}`;
}

// node_modules/@mui/x-internals/esm/isDeepEqual/isDeepEqual.js
function isDeepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    if (a.constructor !== b.constructor) {
      return false;
    }
    if (Array.isArray(a)) {
      const length2 = a.length;
      if (length2 !== b.length) {
        return false;
      }
      for (let i = 0; i < length2; i += 1) {
        if (!isDeepEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) {
        return false;
      }
      const entriesA = Array.from(a.entries());
      for (let i = 0; i < entriesA.length; i += 1) {
        if (!b.has(entriesA[i][0])) {
          return false;
        }
      }
      for (let i = 0; i < entriesA.length; i += 1) {
        const entryA = entriesA[i];
        if (!isDeepEqual(entryA[1], b.get(entryA[0]))) {
          return false;
        }
      }
      return true;
    }
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) {
        return false;
      }
      const entries = Array.from(a.entries());
      for (let i = 0; i < entries.length; i += 1) {
        if (!b.has(entries[i][0])) {
          return false;
        }
      }
      return true;
    }
    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      const length2 = a.length;
      if (length2 !== b.length) {
        return false;
      }
      for (let i = 0; i < length2; i += 1) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    }
    if (a.constructor === RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }
    if (a.valueOf !== Object.prototype.valueOf) {
      return a.valueOf() === b.valueOf();
    }
    if (a.toString !== Object.prototype.toString) {
      return a.toString() === b.toString();
    }
    const keys = Object.keys(a);
    const length = keys.length;
    if (length !== Object.keys(b).length) {
      return false;
    }
    for (let i = 0; i < length; i += 1) {
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
        return false;
      }
    }
    for (let i = 0; i < length; i += 1) {
      const key = keys[i];
      if (!isDeepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  return a !== a && b !== b;
}

export {
  lruMemoize,
  createSelector2 as createSelector,
  createSelectorMemoizedWithOptions,
  createSelectorMemoized,
  require_shim,
  reactMajor_default,
  useStore,
  useStoreEffect,
  Store,
  warnOnce,
  isDeepEqual,
  fastObjectShallowCompare,
  useComponentRenderer
};
/*! Bundled license information:

use-sync-external-store/cjs/use-sync-external-store-shim.development.js:
  (**
   * @license React
   * use-sync-external-store-shim.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js:
  (**
   * @license React
   * use-sync-external-store-shim/with-selector.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=chunk-73VCE5T2.js.map
