const { dataPath } = require("misc");

let configs = null;

const init = () => {
  if (configs === null) {
    const filepath = exports.dataPath("config.json");
    console.log(filepath);
    try {
      configs = require(filepath);
    } catch (err) {
      console.log("invalid config.json:", err.stack);
      process.exit(1);
    }
  }
};

//check if config has key
const has = key => {
  init();
  return key in configs;
};

//get config key
const get = (key, def) => {
  init();
  let value = configs[key];
  if (!has(key)) {
    if (def === undefined) {
      throw `missing config key: ${key}`;
    }
    return def;
  }
  return value;
};

//create a new destination object using the
//provided source object and specification
const template = (src, spec) => {
  if (typeof src !== "object") {
    throw `expected source object`;
  } else if (typeof spec !== "object") {
    throw `expected spec object`;
  }
  const dst = {};
  for (let k in src) {
    //copy extra fields over directly
    if (!(k in spec)) {
      dst[k] = src[k];
    }
  }
  for (let k in spec) {
    let val = src[k];
    const vtype = typeof val;
    const field = spec[k];
    const ftype = field.type;
    if (!ftype) {
      throw `specification field "${k}" missing type`;
    } else if (ftype === "config") {
      if (val && exports.has(val)) {
        val = exports.get(val);
      } else if (!val && field.key && exports.has(field.key)) {
        val = exports.get(field.key);
      }
    } else if (ftype === "array" && Array.isArray(val) && field.element) {
      val = val.map(v => template(v, field.element));
    } else if (vtype === "undefined") {
      if (field.required) {
        throw `field "${k}" is required`;
      } else if (field.default) {
        val = field.default;
      }
    } else if (ftype !== vtype) {
      throw `field "${k}" is ${vtype} (expected ${ftype})`;
    }
    if (val !== undefined) {
      dst[k] = val;
    }
  }

  return dst;
};

var exports = get;
exports.dataPath = dataPath;
exports.has = has;
exports.get = get;
exports.template = template;
module.exports = exports;
