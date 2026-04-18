import generateID from "../utils/IDgenerator.js";
//short the url
export const generateShortCode = () => {
    const id = generateID();
    let num = id;
    let res = "";
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    while (id > 0) {
        res = chars[id % 62] + res;
        num = Math.floor(id / 62);
    }
    return { id, shortCode: res };
};
//# sourceMappingURL=url.service.js.map