const crypto = require("crypto");
const pbkdf2 = require("pbkdf2");

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

//hash object, ignoring key order
exports.hashObject = function(object) {
  return exports.md5(
    JSON.stringify(object, (_, v) => {
      if (v && typeof v === "object") {
        const o = {};
        const ks = Object.keys(v).sort();
        for (const k of ks) {
          o[k] = v[k];
        }
        return o;
      }
      return v;
    })
  );
};

//hash row (flat object), specifying keys
exports.rowHasher = function(keys) {
  return function(row) {
    const h = crypto.createHash("md5");
    const ks = keys || Object.keys(row).sort();
    for (const key of ks) {
      h.update(`${key}=${row[key]}`);
    }
    return h.digest("hex");
  };
};
