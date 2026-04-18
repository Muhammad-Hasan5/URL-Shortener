import autocannon from "autocannon";
import { clear } from "node:console";

const run = async () => {
  const result = await autocannon({
    url: "http://localhost:3000/NiSaiuNOp1",
    connections: 100,
    duration: 20,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

    console.log(result)
};

run();
