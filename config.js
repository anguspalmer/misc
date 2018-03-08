const { dataPath } = require("misc");

let configs = null;
try {
  configs = require(dataPath("config.json"));
} catch (err) {
  console.log("invalid config.json: " + err);
  process.exit(1);
}

//check if config has key
const has = key => {
  return key in configs;
};

//get config key
const get = (key, def) => {
  let value = configs[key];
  if (!has(key)) {
    if (def === undefined) {
      throw `missing config key: ${key}`;
    }
    return def;
  }
  return value;
};

let api = get;
api.get = get;
api.has = has;
module.exports = api;
