import logger from "../../observability/pino-logging/index.pino.js";

export class SnowflakeGenerator {
  /* date: November 14, 2023 ids will generate till 2092*/
  private readonly EPOCH = 1700000000000;

  private lastTimestamp = 0n;

  private readonly machineID: bigint;

  private sequence = 0n;

  constructor(id: bigint) {
    this.machineID = id;
  }

  generate(): bigint {
    let now = BigInt(Date.now());

    //check for drift in time
    if (now < this.lastTimestamp) {
      const drift = this.lastTimestamp - now;
      if (drift > 100n) {
        throw new Error(
          `Clock drifted back ${drift}ms, refusing to generate ID`,
        );
      }
      while (BigInt(Date.now()) <= this.lastTimestamp) {}
      now = BigInt(Date.now());
    }

    //checking for same ms sequence allotment
    if (now === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & 0xfffn;
      if (this.sequence === 0n) {
        while (BigInt(Date.now()) <= this.lastTimestamp) {}
        now = BigInt(Date.now());
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = now;

    const snowflakeId =
      ((now - BigInt(this.EPOCH)) << 22n) |
      (this.machineID << 12n) |
      this.sequence;

    logger.debug(
      { snowflakeId: snowflakeId.toString() },
      "snowflake id generated",
    );

    return snowflakeId;
  }
}
