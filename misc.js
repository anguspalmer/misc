module.exports = {
  //bind all methods on the instance
  bindMethods(instance) {
    let Class = Object.getPrototypeOf(instance);
    for (let name of Object.getOwnPropertyNames(Class)) {
      let method = instance[name];
      if (!(method instanceof Function) || name === "constructor") {
        continue;
      }
      instance[name] = method.bind(instance);
    }
  },
  //shuffle the provided array
  shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
  },
  //csv contains more functions
  csv: require("./csv"),
  //config contains a configuration loader
  config: require("./config"),
  //insert string functions
  ...require("./strings"),
  //insert crypto functions
  ...require("./crypto")
};
