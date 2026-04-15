const increment = (function () {
    let count = 0;
    return function () {
        return ++count;
    };
})();
export default function generateID() {
    let id = "";
    return "0-" + String(Date.now()) + "-" + String(increment());
}
//# sourceMappingURL=IDgenerator.js.map