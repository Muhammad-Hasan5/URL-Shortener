import CircuitBreaker from "opossum";
const createBreaker = (fn, options = {}) => {
    return new CircuitBreaker(fn, {
        timeout: 300,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        ...options,
    });
};
export default createBreaker;
//# sourceMappingURL=index.js.map