global.window = { HYDRIS_DATA: require("../js/hydris-data.js") };
const H = require("../js/hydris.js");
["go mi zy waewe bi gymu", "la jo jota.", "la xyz jota"].forEach((s) => {
  console.log("IN :", s);
  console.log("OUT:", H.translateH2Z(s));
});
