exports.btoa = function(ascii) {
  return Buffer.from(ascii).toString("base64");
};

exports.atob = function(b64) {
  return Buffer.from(b64, "base64").toString("ascii");
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
  if (!/^(\d+)\s*(d|h|m|s|ms)$/.test(str)) {
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
