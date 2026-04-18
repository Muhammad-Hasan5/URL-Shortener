import autocannon from "autocannon";
const run = async () => {
    const result = await autocannon({
        url: "http://localhost:3000/shorten",
        connections: 10,
        duration: 10,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            longURL: "https://example.com",
        }),
    });
    console.log(result);
};
run();
//# sourceMappingURL=post.loadTesting.js.map