import generateID from "./utils/IDgenerator.js";
let count = 0;
while (1) {
    count++;
    if (count > 1000)
        break;
    console.log(generateID());
}
//# sourceMappingURL=index.js.map