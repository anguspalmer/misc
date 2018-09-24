const { bindMethods } = require("misc");

exports.load = filepath => new ConfigMap(filepath);

class ConfigMap {
  constructor(filepath) {
    bindMethods(this);
    try {
      this.data = require(filepath);
    } catch (err) {
      throw new Error(`invalid config.json: ${filepath}`);
    }
  }

  //check if config has key
  has(key) {
    return key in this.data;
  }

  //get config key
  get(key, def) {
    let value = this.data[key];
    if (!this.has(key)) {
      if (def === undefined) {
        throw `missing config key: ${key}`;
      }
      return def;
    }
    return value;
  }

  //create a new destination object using the
  //provided source object and specification
  template(src, spec) {
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
        if (val && this.has(val)) {
          val = this.get(val);
        } else if (!val && field.key && this.has(field.key)) {
          val = this.get(field.key);
        }
      } else if (ftype === "array" && Array.isArray(val) && field.element) {
        val = val.map(v => this.template(v, field.element));
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
  }
}
