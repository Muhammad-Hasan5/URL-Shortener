import generateID from "./snowflakeID.service.js";

type ShortCodeType = {
  id: bigint,
  shortCode: string
}

//short the url
export const generateShortCode = (): ShortCodeType => {
  const id = generateID();
  let num: bigint = id;
  let res: string = "";
  let chars: string =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  while (num > 0n) {
    let rem = num % 62n;
    res = chars[Number(rem)] + res;
    num = BigInt(Math.floor(Number(num / 62n)));
  }

  return { id: id, shortCode: res };
};
