const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  res.json({ ip: ip });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
