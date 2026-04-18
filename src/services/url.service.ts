import generateID from "../utils/IDgenerator.js";

//short the url
export const generateShortCode = () => {
    const id = generateID()
    let num = id
    let res = "";
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    
    while (num > 0) {
      res = chars[num % 62] + res;
      num = Math.floor(num / 62);
    }

    return {id, shortCode: res}
}