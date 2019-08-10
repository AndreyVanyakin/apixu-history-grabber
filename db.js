const { DB_NAME, DB_URL } = require("./config");
const { isArray } = require("util");
const R = require("ramda");

const MongoClient = require("mongodb").MongoClient;
let client = new MongoClient(DB_URL);
let db;

const initDB = async () => {
  try {
    // CREATE DB
    await client.connect();
    console.log("[db] Connected to server");
    db = client.db(DB_NAME);

    const existingColls = (await db
      .listCollections({}, { nameOnly: true })
      .toArray()).map(collObj => collObj.name);

    // check if exist and create index
    if (!R.includes("history", existingColls)) {
      const collection = await db.createCollection("history");
      await collection.createIndex({
        "location.name": 1,
        "forecast.forecastday.date_epoch": -1
      });

      console.log("[db] Created _history_ collection");
    } else {
      console.log("[db] _history_ collection was created before");
    }

    console.log("[db] Db and all collections initialised sucessfully");
    // await client.close();
  } catch (err) {
    console.error(err);
  }
};

// RETURN BOOL WHETHER DOCUMENT EXISTS
const isDocExists = (location, date) => {
  return db
    .collection("history")
    .find({
      "location.name": location,
      "forecast.forecastday.date": date
    })
    .limit(1)
    .toArray()
    .then(res => res.length > 0);
};

// IN EITHER ARRAY OR SINGLE DOC
const writeDoc = data => {
  if (isArray(data)) {
    return db
      .collection("history")
      .insertMany(data)
      .then(console.log(`[db] insterted ${data.length} records`));
  } else {
    const { location, forecast } = data;
    return db
      .collection("history")
      .insertOne(data)
      .then(
        console.log(
          `[db] Inserted ${location.name} ${
            forecast.forecastday[0].date
          } and resting`
        )
      )
      .catch(err => console.error(err));
  }
};

const closeDB = () => {
  client.close();
};

module.exports = { initDB, isDocExists, writeDoc, closeDB };
