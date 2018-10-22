//decode functions
exports.decode = (str, opts = {}) => {
  let rows = (str ? str.toString() : "")
    .split("\n")
    .filter(r => r && !r.startsWith("#"))
    .map(exports.decode.row);
  //use the header row to map rows into objects
  if (opts.header) {
    const header = rows.shift();
    rows = rows.map(row => {
      const o = {};
      if (row.length !== header.length) {
        throw `row has ${row.length}, expected ${header.length}: ${row}`;
      }
      for (let i = 0; i < row.length; i++) {
        o[header[i]] = row[i];
      }
      return o;
    });
  }
  //result
  return rows;
};
exports.decode.row = r => {
  let col = "";
  let quoted = false;
  const cols = [];
  for (let c of r) {
    if (c === '"') {
      quoted = !quoted;
      continue;
    } else if (c === "," && !quoted) {
      cols.push(col);
      col = "";
      continue;
    }
    col += c;
  }
  if (col) {
    cols.push(col);
  }
  return cols;
};

//special streaming decode
//NOTE REQUIRES NODE 10+
//async generator function:
//a promise, wrapped around a function which
//yields objects (decoded csv rows),
//the promise rejects if any error is encountered,
//and resolves once the entire file has been read.
// exports.decode.stream = async function*(filepath) {
//   throw "TODO";
// };

//encode functions
exports.encode = (rows, opts = {}) => {
  //compute headers from all data
  if (opts.header) {
    //one pass to get all headers
    const headerSet = new Set();
    //check all rows and all columns for headers
    for (const row of rows) {
      if (!row || Array.isArray(row)) {
        throw `Expected row object`;
      }
      for (const key in row) {
        headerSet.add(key);
      }
    }
    const header = Array.from(headerSet);
    //predefined header order, inplace sort
    if (Array.isArray(opts.header)) {
      const order = opts.header.filter(h => headerSet.has(h));
      for (let i = 0; i < order.length; i++) {
        const target = order[i];
        const j = header.indexOf(target);
        if (j === i || j === -1) {
          //matches/missing, skip
          continue;
        }
        //exists, in wrong order, swap
        const current = header[i];
        header[i] = target;
        header[j] = current;
      }
    }
    //next pass to write out columns
    rows = [header].concat(
      rows.map(row => {
        const cols = [];
        for (let i = 0; i < header.length; i++) {
          cols[i] = row[header[i]];
        }
        return cols;
      })
    );
  }
  //write out csv rows
  return rows.map(exports.encode.row).join("\n");
};
exports.encode.row = row => row.map(exports.encode.col).join(",");
exports.encode.col = c =>
  c === null || c === undefined ? "" : /,/.test(c) ? `"${c}"` : c;
