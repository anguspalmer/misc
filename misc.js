const path = require("path");
const crypto = require("crypto");
const pbkdf2 = require("pbkdf2");

exports.root = require("os").tmpdir();

exports.filepath = function() {
  let args = Array.prototype.slice.call(arguments);
  args = [exports.root].concat(args);
  let p = path.join.apply(null, args);
  return p;
};

exports.randomId = function(n, encoding) {
  return crypto.randomBytes(n).toString(encoding);
};

exports.hex = function(chars) {
  if (!chars) chars = 16;
  return exports.randomId(Math.ceil(chars / 2), "hex");
};

exports.hashPassword = function(password, salt) {
  return pbkdf2.pbkdf2Sync(password, salt, 1, 32, "sha512").toString("hex");
};

exports.newPassword = function(password) {
  let salt = exports.hex(64);
  let hash = exports.hashPassword(password, salt);
  return salt + hash;
};

exports.verifyPassword = function(attempt) {
  let salt = this.password.slice(0, 64);
  let hash = this.password.slice(64, 128);
  return hash === exports.hashPassword(attempt, salt);
};

exports.btoa = function(ascii) {
  return new Buffer(ascii).toString("base64");
};

exports.atob = function(b64) {
  return new Buffer(b64, "base64").toString("ascii");
};

exports.bindMethods = function(instance) {
  let Class = Object.getPrototypeOf(instance);
  for (let name of Object.getOwnPropertyNames(Class)) {
    let method = instance[name];
    if (!(method instanceof Function) || name === "constructor") {
      continue;
    }
    instance[name] = method.bind(instance);
  }
};

//milliseconds duration to human readable
exports.duration = function(millis) {
  var v = millis;
  if (v < 0) return "<future>";
  var s;
  var scale = [
    ["ms", 1000],
    ["sec", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 31],
    ["month", 12],
    ["year"]
  ];
  for (var i = 0; i < scale.length; i++) {
    s = scale[i];
    if (!s[1] || v < s[1]) break;
    v = Math.round(v / s[1]);
  }
  return v + " " + s[0] + (s[0] === "ms" || v === 1 ? "" : "s");
};

exports.bytes = function(n, d) {
  // set defaults
  if (typeof n !== "number" || isNaN(n) || n == 0) return "0 B";
  if (!d || typeof d !== "number") d = 1;
  // set scale index 1000,100000,... becomes 1,2,...
  var i = Math.floor(Math.floor(Math.log(n) * Math.LOG10E) / 3);
  // set rounding factor
  var f = Math.pow(10, d);
  // scale n down and round
  var s = Math.round(n / Math.pow(10, i * 3) * f) / f;
  // concat (no trailing 0s) and choose scale letter
  return (
    s.toString().replace(/\.0+$/, "") +
    " " +
    ["", "K", "M", "G", "T", "P", "Z"][i] +
    "B"
  );
};

exports.shuffle = function(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
};
