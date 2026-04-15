let EPOCH = 1700000000000;

let timestamp: number = 0;
let lastTimestamp: number = 0;

let machineID: number = 1;

let sequence: number = 0;

export default function generateID() {
  timestamp = Date.now();

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1) & 0xfff;

    if (sequence === 0) {
      timestamp = lastTimestamp;

      while (Date.now() <= lastTimestamp) {}
      timestamp = Date.now();
    }
  } else {
    sequence = 0;
  }

  lastTimestamp = timestamp;

  return ((timestamp - EPOCH) << 22) | (machineID << 22) | (sequence << 12);
}
