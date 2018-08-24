const { dataPath } = require("misc");

let configs = null;

const init = () => {
  if (configs !== null) {
    try {
      configs = require(exports.dataPath("config.json"));
    } catch (err) {
      console.log("invalid config.json: " + err);
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

var exports = get;
exports.dataPath = dataPath;
exports.has = has;
exports.get = get;
module.exports = exports;
