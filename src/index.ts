process.loadEnvFile()

import app from "./app.js";

app.listen(process.env.PORT, () => {
  console.log(`App is running on port http://localhost:${process.env.PORT}`);
});
