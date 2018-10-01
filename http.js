const attemptRequire = name => {
  try {
    return require(name);
  } catch (err) {
    if (/Cannot find module/.test(err)) {
      return null;
    }
    throw err;
  }
};

//use these only if available
const { Sequelize } = attemptRequire("database");
const { cache } = attemptRequire("cache");
const slack = attemptRequire("slack");

// wrap takes an async http handler and
// returns a another handler which responds with
// 200 on success and otherwise 400 on failure
exports.wrap = handler => {
  if (typeof handler !== "function") {
    throw new Error(`http wrap expected function`);
  }
  const len = handler.length;
  //convert return value OR thrown value to HTTP responses
  const converter = async (req, res, next) => {
    //record if next was called
    let nexted = false;
    if (next) {
      const orig = next;
      next = () => {
        nexted = true;
        return orig();
      };
    }
    //run handler!
    try {
      let data = await handler.call(null, req, res, next);
      if (res.headersSent || data === undefined || nexted) {
        return;
      }
      res.status(200);
      let out;
      if (typeof data === "string") {
        out = data;
      } else {
        res.set("Content-Type", "application/json");
        out = JSON.stringify(data, null, 2);
      }
      res.send(out);
    } catch (err) {
      if (res.headersSent || nexted) {
        return;
      }
      //show failed SQL errors
      if (err && err.sql) {
        //store SQL errors
        if (cache) {
          cache.putRaw(`error-${+new Date()}.sql`, err.sql);
        }
        console.log("SQL Error:");
        console.log(err.sql.slice(0, 10000));
      }
      //sequelize errors
      if (Sequelize && err instanceof Sequelize.ValidationError) {
        //db user error!
        let error = err.toString();
        if (err.errors && err.errors.length > 0) {
          error = err.errors[0].message;
        }
        res.status(400).send({ error });
      } else if (Sequelize && err instanceof Sequelize.DatabaseError) {
        //db server error!
        console.log("Sequelize.DatabaseError", err.toString());
        res.status(500).send({ error: "Database error" });
      } else if (err instanceof Error) {
        //node server crash!
        if (slack) {
          slack.error("HANDLE ERROR\n" + err.stack);
        }
        res.status(500).send("server error");
      } else {
        //throw string
        let msg = err.message || err.toString();
        let status = err.status;
        if (!status) {
          if (/not found/i.test(msg)) {
            status = 404;
          } else if (/auth/i.test(msg)) {
            status = 401;
          } else {
            status = 400;
          }
        }
        //all other errors
        res.status(status).send({ error: msg });
      }
    }
  };
  //express checks the number of args to determine the type of handler.
  //so, our wrapper must match the arity of our handler.
  const args = new Array(len).fill().map((_, i) => `arg${i}`);
  const body = `return this.converter.apply(null, arguments);`;
  const wrapper = new Function(args, body).bind({ converter });
  //DEBUG console.log(`[misc/http] wrapped "${handler.name}" (#${len})`);
  return wrapper;
};
