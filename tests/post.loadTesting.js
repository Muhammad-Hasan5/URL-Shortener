import autocannon from "autocannon";
import { clear } from "node:console";

const run = async () => {
  const result = await autocannon({
    url: "http://localhost:3000/shorten",
    connections: 50,
    duration: 20,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      longURL: "https://youtube.com",
    }),
  });

    console.log(result)
};

run();
