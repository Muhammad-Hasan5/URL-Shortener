export async function claimMachineID(redis: any): Promise<{
  machineId: bigint;
  stopRenewal: () => void;
}> {
  for (let id = 0; id <= 1023; id++) {
    const claimed = await redis.set(
      `snowflake:machine:${id}`,
      "claimed",
      "EX",
      60,
      "NX",
    );
    if (claimed === "OK") {
      const interval = setInterval(async () => {
        await redis.set(`snowflake:machine:${id}`, "claimed", "EX", 60, "XX");
      }, 30_000);

      interval.unref();
      
      const stopRenewal = () => clearInterval(interval);
      return { machineId: BigInt(id), stopRenewal };
    }
  }
  throw new Error("No machine IDs available");
}
