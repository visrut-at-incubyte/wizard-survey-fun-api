import express, { json } from "express";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());

app.get("/", (req, res) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : req.connection.remoteAddress;
  res.json({ ip: ip });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
