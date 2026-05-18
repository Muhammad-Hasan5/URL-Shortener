import logger from "../config/pino-logging/index.pino.js";

let EPOCH = 1700000000000;

let timestamp: bigint = 0n;
let lastTimestamp: bigint = 0n;

let machineID: bigint = 1n;

let sequence: bigint = 0n;

export default function generateID(): bigint {
  timestamp = BigInt(Date.now());

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & 0xfffn;

    if (sequence === 0n) {
      while (Date.now() <= lastTimestamp) {}
      timestamp = BigInt(Date.now());
    }
  } else {
    sequence = 0n;
  }

  lastTimestamp = timestamp;

  const snowfalke_ID =
    ((timestamp - BigInt(EPOCH)) << 22n) | (machineID << 12n) | sequence;

  logger.info({ snowfalke_ID }, "snowflake id created successfully");
  
  return snowfalke_ID;
}
