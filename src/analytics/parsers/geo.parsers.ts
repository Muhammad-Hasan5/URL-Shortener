import { Reader } from "@maxmind/geoip2-node";
import env from "../../config/env.js";
import { readFileSync } from "fs";

let cityBuffer = readFileSync(env.GEO_CITY_DB_PATH);
let cityData = Reader.openBuffer(cityBuffer);

export function getLocation(ip: string) {
  let cityRes = cityData.city(ip);

  return {
    countryCode: cityRes.country?.isoCode,
    countryName: cityRes.country?.names.en,
    city: cityRes.city?.names.en,
    region: cityRes.subdivisions?.[0]?.names.en,
    latitude: cityRes.location?.latitude,
    longitude: cityRes.location?.longitude,
    timezone: cityRes.location?.timeZone,
    t: cityRes.country?.names,
  };
}
