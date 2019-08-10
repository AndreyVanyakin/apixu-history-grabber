// 1) Connect db and
// 1) On startup - get history for all locations for 7 days.
// 2) Put to db, overwrite
// 3) Schedule morning download for previous day

const url = require("url");
const moment = require("moment");
const axios = require("axios");
const R = require("ramda");

const { BASE_URL, KEY, LOCATIONS, DAYS_BEFORE } = require("./config");
const { initDB, writeDoc, closeDB, isDocExists } = require("./db");

const apixu = new URL(BASE_URL);
apixu.searchParams.append("key", "q", "dt", "lang");
apixu.searchParams.set("key", KEY);
apixu.searchParams.set("lang", "ru");

const grabData = (loc, dt) => {
  apixu.searchParams.set("q", loc);
  apixu.searchParams.set("dt", dt);
  return axios
    .get(apixu.href)
    .then(res => res.data)
    .catch(err => console.error(err));
};

const weekDates = () =>
  R.range(1, DAYS_BEFORE + 1).map(v =>
    moment()
      .hours(00)
      .minutes(00)
      .seconds(00)
      .subtract(v, "days")
      .format("YYYY-MM-DD")
  );

const run = async () => {
  try {
    // 1) INIT DB
    await initDB();

    // 2) Grab data
    const dates = weekDates();

    const docs = R.flatten(
      await Promise.all(
        LOCATIONS.map(async loc => {
          // DATES TO FETCH
          const missionDates = R.without(
            [null],
            await Promise.all(
              dates.map(async dt => {
                const exists = await isDocExists(loc, dt);

                if (!exists) {
                  console.log(`Will grab ${loc} @ ${dt}`);
                  return dt;
                } else {
                  console.log(`Will not grab ${loc} @ ${dt}`);
                  return null;
                }
              })
            )
          );
          // console.log(missionDates);

          // FETCH DATA
          const data = await Promise.all(
            missionDates.map(async mdt => await grabData(loc, mdt))
          );

          return data;
        })
      )
    );

    // console.log("docs", docs);

    //  WRITE DATA
    await writeDoc(docs).then(() => {
      console.log("Evetually");
      process.exit();
    });
  } catch (error) {
    console.error(error);
  }
};

run();
