// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"js/car.js":[function(require,module,exports) {
function Car(params) {
  var self = this;
  var car;
  var mtlLoader = new THREE.MTLLoader();
  this.speed = 0;
  this.rSpeed = 0;
  this.run = false;
  this.acceleration = 0.1;
  this.deceleration = 0.04;
  this.maxSpeed = 2;
  this.light = params.light;
  this.lock = -1;
  this.isBrake = false;
  this.realRotation = 0; // 真实的旋转
  this.dirRotation = 0; // 方向上的旋转
  this.addRotation = 0; // 累计的旋转角度

  this.leftFront = {};
  this.leftBack = {};
  mtlLoader.setPath('./assets/');
  mtlLoader.load('ph.mtl', function (materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('./assets/');
    objLoader.load('auto.obj', function (object) {
      car = object;
      car.children.forEach(function (item) {
        item.castShadow = true;
      });
      car.position.z = -20;
      car.position.y = -5;
      params.scene.add(car);
      self.car = car;
      params.cb();
    }, function () {
      console.log('progress');
    }, function () {
      console.log('error');
    });
  });
  self.frontRightWheel = new Wheel({
    mtl: 'front_wheel.mtl',
    obj: 'front_wheel.obj',
    parent: car,
    scene: params.scene,
    offsetX: 2.79475,
    offsetZ: -3.28386
  });
  self.frontLeftWheel = new Wheel({
    mtl: 'front_wheel.mtl',
    obj: 'front_wheel.obj',
    parent: car,
    scene: params.scene,
    offsetX: -2.79475,
    offsetZ: -3.28386
  });
}
Car.prototype.tick = function (params) {
  if (this.lock > 0) {
    this.lock--;
    if (this.lock % 2) {
      this.car.visible = false;
    } else {
      this.car.visible = true;
    }
    return;
  }
  if (this.run) {
    this.speed += this.acceleration;
    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }
  } else {
    this.speed -= this.deceleration;
    if (this.speed < 0) {
      this.speed = 0;
    }
  }
  var speed = -this.speed;
  if (speed === 0) {
    return;
  }
  var time = Date.now();
  this.dirRotation += this.rSpeed;
  this.realRotation += this.rSpeed;
  var rotation = this.dirRotation;
  if (this.isBrake) {
    this.realRotation += this.rSpeed * (this.speed / 2);
  } else {
    if (this.realRotation !== this.dirRotation) {
      this.dirRotation += (this.realRotation - this.dirRotation) / 20000 * this.speed * (time - this.cancelBrakeTime);
    }
  }
  var speedX = Math.sin(rotation) * speed;
  var speedZ = Math.cos(rotation) * speed;
  var tempX = this.car.position.x + speedX;
  var tempZ = this.car.position.z + speedZ;
  /* 
  this.light.shadow.camera.left = (tempZ-50+20) >> 0;
  this.light.shadow.camera.right = (tempZ+50+20) >> 0;
  this.light.shadow.camera.top = (tempX+50) >> 0;
  this.light.shadow.camera.bottom = (tempX-50) >> 0;
  this.light.position.set(-120+tempX, 500, tempZ);
  this.light.shadow.camera.updateProjectionMatrix();*/

  this.light.position.set(-10 + tempX, 20, tempZ);
  this.light.shadow.camera.updateProjectionMatrix();
  var tempA = -(this.car.rotation.y + 0.523);
  this.leftFront.x = Math.sin(tempA) * 8 + tempX;
  this.leftFront.y = Math.cos(tempA) * 8 + tempZ;
  tempA = -(this.car.rotation.y + 2.616);
  this.leftBack.x = Math.sin(tempA) * 8 + tempX;
  this.leftBack.y = Math.cos(tempA) * 8 + tempZ;
  var collisionSide = this.physical();
  var correctedSpeed;
  if (collisionSide > -1) {
    correctedSpeed = this.collision(speedX, speedZ, collisionSide);
    speedX = correctedSpeed.vx * 5;
    speedZ = correctedSpeed.vy * 5;
    var angle = Math.atan2(-speedZ, speedX);
    this.realRotation = -1 * (Math.PI / 2 - angle);
    rotation = this.dirRotation = this.realRotation;
    this.speed = 0;
    this.reset();
  }
  this.car.rotation.y = this.realRotation;
  this.frontLeftWheel.wrapper.rotation.y = this.realRotation;
  this.frontRightWheel.wrapper.rotation.y = this.realRotation;
  this.frontLeftWheel.wheel.rotation.y = (this.dirRotation - this.realRotation) / 2;
  this.frontRightWheel.wheel.rotation.y = (this.dirRotation - this.realRotation) / 2;
  this.car.position.z += speedZ;
  this.car.position.x += speedX;
  this.frontLeftWheel.wrapper.position.z += speedZ;
  this.frontLeftWheel.wrapper.position.x += speedX;
  this.frontRightWheel.wrapper.position.z += speedZ;
  this.frontRightWheel.wrapper.position.x += speedX;
  params.camera.rotation.y = rotation;
  params.camera.position.x = this.car.position.x + Math.sin(rotation) * 20;
  params.camera.position.z = this.car.position.z + Math.cos(rotation) * 20;
};
Car.prototype.brake = function () {
  this.v = 10;
  this.isBrake = true;
};
Car.prototype.cancelBrake = function () {
  this.cancelBrakeTime = Date.now();
  this.isBrake = false;
};
Car.prototype.physical = function () {
  var i = 0;

  // for (; i < outside.length; i += 4) {
  //     if (isLineSegmentIntr(this.leftFront, this.leftBack, {
  //         x: outside[i],
  //         y: outside[i + 1]
  //     }, {
  //         x: outside[i + 2],
  //         y: outside[i + 3]
  //     })) {
  //         return i;
  //     }
  // }

  return -1;
};
Car.prototype.reset = function () {
  this.lock = 60;
};
Car.prototype.collision = function (sx, sz, side) {
  var pos = this.car.position;
  var result = getBounceVector({
    p0: {
      x: pos.x,
      y: pos.z
    },
    p1: {
      x: pos.x + sx,
      y: pos.z + sz
    },
    vx: sx,
    vy: sz
  }, {
    p0: {
      x: outside[side],
      y: outside[side + 1]
    },
    p1: {
      x: outside[side + 2],
      y: outside[side + 3]
    },
    vx: outside[side + 2] - outside[side],
    vy: outside[side + 3] - outside[side + 1]
  });
  return result;
};
function Wheel(params) {
  var mtlLoader = new THREE.MTLLoader();
  var self = this;
  mtlLoader.setPath('./assets/');
  mtlLoader.load(params.mtl, function (materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('./assets/');
    objLoader.load(params.obj, function (object) {
      object.children.forEach(function (item) {
        item.castShadow = true;
      });
      var wrapper = new THREE.Object3D();
      wrapper.position.set(0, -5, -20);
      wrapper.add(object);
      object.position.set(params.offsetX, 0, params.offsetZ);
      params.scene.add(wrapper);
      self.wheel = object;
      self.wrapper = wrapper;
    }, function () {
      console.log('progress');
    }, function () {
      console.log('error');
    });
  });
}
function isLeft(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) < 0;
}
function getBounceVector(obj, w) {
  var len = Math.sqrt(w.vx * w.vx + w.vy * w.vy);
  w.dx = w.vx / len;
  w.dy = w.vy / len;
  w.rx = -w.dy;
  w.ry = w.dx;
  w.lx = w.dy;
  w.ly = -w.dx;
  var projw = getProjectVector(obj, w.dx, w.dy);
  var projn;
  var left = isLeft(w.p0, w.p1, obj.p0);
  if (left) {
    projn = getProjectVector(obj, w.rx, w.ry);
  } else {
    projn = getProjectVector(obj, w.lx, w.ly);
  }
  projn.vx *= -0.5;
  projn.vy *= -0.5;
  return {
    vx: projw.vx + projn.vx,
    vy: projw.vy + projn.vy
  };
}
function getProjectVector(u, dx, dy) {
  var dp = u.vx * dx + u.vy * dy;
  return {
    vx: dp * dx,
    vy: dp * dy
  };
}
function isLineSegmentIntr(a, b, c, d) {
  // console.log(a, b);
  var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
  var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);
  if (area_abc * area_abd > 0) {
    return false;
  }
  var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);
  var area_cdb = area_cda + area_abc - area_abd;
  if (area_cda * area_cdb > 0) {
    return false;
  }
  return true;
}
},{}],"node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}
module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "64198" + '/');
  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);
    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);
          if (didAccept) {
            handled = true;
          }
        }
      });

      // Enable HMR for CSS by default.
      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });
      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }
    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }
    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }
    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}
function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}
function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}
function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }
  var parents = [];
  var k, d, dep;
  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }
  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }
  return parents;
}
function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}
function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }
  if (checkedAssets[id]) {
    return;
  }
  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }
  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}
function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }
  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }
  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }
}
},{}]},{},["node_modules/parcel-bundler/src/builtins/hmr-runtime.js","js/car.js"], null)
//# sourceMappingURL=/car.8ceea049.js.map