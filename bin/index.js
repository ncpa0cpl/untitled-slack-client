"use strict";

var _react = _interopRequireDefault(require("react"));
var _valenceNative = require("valence-native");
var _main = require("./main");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
_valenceNative.AppRegistry.registerComponent("client", /*#__PURE__*/_react["default"].createElement(_main.Main, null));

// =============================================================================
// This is for hot reloading (this will be stripped off in production by
// webpack)
// THIS SHOULD NOT BE CHANGED
// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.accept(["./app"], function () {
    // eslint-disable-next-line
    var app = require("./app")["default"];
    _valenceNative.AppRegistry.updateProxy(app);
  });
}