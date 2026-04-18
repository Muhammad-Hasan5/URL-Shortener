let EPOCH = 1700000000000;
let timestamp = 0n;
let lastTimestamp = 0n;
let machineID = 1n;
let sequence = 0n;
export default function generateID() {
    timestamp = BigInt(Date.now());
    if (timestamp === lastTimestamp) {
        sequence = (sequence + 1n) & 0xfffn;
        if (sequence === 0n) {
            timestamp = lastTimestamp;
            while (Date.now() <= lastTimestamp) { }
            timestamp = BigInt(Date.now());
        }
    }
    else {
        sequence = 0n;
    }
    lastTimestamp = timestamp;
    return ((timestamp - BigInt(EPOCH)) << 22n) | (machineID << 22n) | sequence;
}
//# sourceMappingURL=IDgenerator.js.map