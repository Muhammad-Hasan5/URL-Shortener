import autocannon from "autocannon";
import { clear } from "node:console";

const run = async () => {
  const result = await autocannon({
    url: "http://localhost:3000/shorten",
    connections: 100,
    duration: 20,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      longURL: "https://outlook.com",
    }),
  });

    console.log(result)
};

run();
