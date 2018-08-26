const path = require("path");
const crypto = require("crypto");
const pbkdf2 = require("pbkdf2");

exports.dataDir = require("os").tmpdir();

exports.setDataDir = dir => {
  exports.dataDir = dir;
};

exports.dataPath = function(...args) {
  if (!exports.dataDir) {
    throw `data dir unset`;
  }
  return path.join(exports.dataDir, ...args);
};

exports.randomId = function(n, encoding) {
  return crypto.randomBytes(n).toString(encoding);
};

exports.hex = function(chars) {
  if (!chars) chars = 16;
  return exports.randomId(Math.ceil(chars / 2), "hex");
};

exports.md5 = function(message) {
  return crypto
    .createHash("md5")
    .update(message)
    .digest("hex");
};

exports.hashPassword = function(password, salt) {
  return pbkdf2.pbkdf2Sync(password, salt, 1, 32, "sha512").toString("hex");
};

exports.newPassword = function(password) {
  let salt = exports.hex(64);
  let hash = exports.hashPassword(password, salt);
  return salt + hash;
};

exports.verifyPassword = function(salthash, attempt) {
  if (!salthash || salthash.length !== 128 || /[^a-f0-9]/.test(salthash)) {
    throw `Invalid salt-hash (expected 128 hex chars)`;
  }
  let salt = salthash.slice(0, 64);
  let hash = salthash.slice(64, 128);
  return hash === exports.hashPassword(attempt, salt);
};

exports.btoa = function(ascii) {
  return Buffer.from(ascii).toString("base64");
};

exports.atob = function(b64) {
  return Buffer.from(b64, "base64").toString("ascii");
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

//milliseconds duration to human readable (number to string)
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

exports.parseDuration = function(str) {
  //duration parser
  if (!/^(\d+)(d|h|m|s|ms)$/.test(str)) {
    throw `invalid duration "${str}"`;
  }
  let n = parseInt(RegExp.$1, 10);
  switch (RegExp.$2) {
    case "d":
      n *= 24;
    case "h":
      n *= 60;
    case "m":
      n *= 60;
    case "s":
      n *= 1000;
    case "ms":
    //noop
  }
  return n;
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
  var s = Math.round((n / Math.pow(10, i * 3)) * f) / f;
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

//fancy csv library
exports.csv = {
  decode(str) {
    return str
      .split("\n")
      .filter(c => c && !c.startsWith("#"))
      .map(c => c.split(","));
  },
  encode(rows) {
    return rows
      .map(cols =>
        cols
          .map(
            c =>
              c === null || c === undefined ? "" : /,/.test(c) ? `"${c}"` : c
          )
          .join(",")
      )
      .join("\n");
  }
};
