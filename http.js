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
  return async (req, res) => {
    try {
      let data = await handler.call(null, req, res);
      if (res.headersSent) {
        return;
      }
      if (data === undefined) {
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
      if (res.headersSent) {
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
        //all other errors
        res
          .status(err.status || 400)
          .send({ error: err.message || err.toString() });
      }
    }
  };
};
