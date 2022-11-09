"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Touchable = void 0;
var _react = _interopRequireDefault(require("react"));
var _valenceNative = require("valence-native");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var Touchable = function Touchable(props) {
  return /*#__PURE__*/_react["default"].createElement(_valenceNative.TouchableOpacity, props);
};
exports.Touchable = Touchable;