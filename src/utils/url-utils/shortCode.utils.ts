import generateID from "./snowflakeID.utils.js";
import z from "zod";

//validation using the Z0D
const shortCodeSchema = z.object({
  id: z.bigint(),
  shortCode: z.string(),
});

type ShortCodeObject = z.infer<typeof shortCodeSchema>;

//short the url
export const generateShortCode = (): ShortCodeObject => {
  const id = generateID();
  let num: bigint = id;
  let res = "";
  let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  while (num > 0n) {
    let rem = num % 62n;
    res = chars[Number(rem)] + res;
    num = BigInt(Math.floor(Number(num / 62n)));
  }

  return { id: id, shortCode: res };
};
