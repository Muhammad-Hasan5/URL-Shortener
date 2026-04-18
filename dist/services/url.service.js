import generateID from "../utils/IDgenerator.js";
//short the url
export const generateShortCode = () => {
    const id = generateID();
    let num = id;
    let res = "";
    let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    while (num > 0n) {
        let rem = num % 62n;
        res = chars[Number(rem)] + res;
        num = BigInt(Math.floor(Number(num / 62n)));
    }
    return { id: id, shortCode: res };
};
//# sourceMappingURL=url.service.js.map