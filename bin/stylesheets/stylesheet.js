"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StyleSheet = void 0;
var _valenceNative = require("valence-native");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
var StyleSheet = /*#__PURE__*/function () {
  function StyleSheet() {
    _classCallCheck(this, StyleSheet);
  }
  _createClass(StyleSheet, [{
    key: "create",
    value: function create(style) {
      return _valenceNative.StyleSheet.create(style);
    }
  }]);
  return StyleSheet;
}();
exports.StyleSheet = StyleSheet;