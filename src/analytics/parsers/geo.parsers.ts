import { Reader } from "@maxmind/geoip2-node";
import { existsSync, readFileSync } from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(
  __dirname,
  "../../../src/analytics/data/GeoLite2-City.mmdb",
);


const cityData = existsSync(dbPath)
  ? Reader.openBuffer(readFileSync(dbPath))
  : null;

export function getLocation(ip: string | undefined) {
  if (!cityData || !ip) return {};

  try {
    const cityRes = cityData.city(ip);

    return {
      countryCode: cityRes.country?.isoCode,
      countryName: cityRes.country?.names.en,
      city: cityRes.city?.names.en,
      region: cityRes.subdivisions?.[0]?.names.en,
      latitude: cityRes.location?.latitude,
      longitude: cityRes.location?.longitude,
      timezone: cityRes.location?.timeZone,
    };
  } catch {
    return {};
  }
}
