import express, { json } from "express";
import clientPromise from "./mongodb.js";
import bodyParser from "body-parser";
import openai from "./openai.js";
import cors from "cors";
import { createHash } from "./utils.js";
import { SURVEY_CREATION_SYSTEM_PROMPT } from "./prompt.js";
const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_REQUEST_LIMIT = 10;

app.use(json());
app.use(bodyParser.json());

const corsOptions = {
  origin: function (origin, callback) {
    if (origin && origin.includes("wizardsurvey") !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.post("/", cors(corsOptions), async (req, res) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : req.connection.remoteAddress;

  const client = await clientPromise;
  const db = client.db("survey-db");

  const hash = createHash(ip);
  const creatorHistory = await db
    .collection("open-ai-limit")
    .findOne({ ipHash: hash });

  if (creatorHistory === null) {
    await db.collection("open-ai-limit").insertOne({ ipHash: hash, count: 1 });
  } else {
    const prevCount = creatorHistory.count;

    if (prevCount >= OPENAI_REQUEST_LIMIT) {
      return NextResponse.json(
        { error: "API limit is reached to generate survey using OpenAI" },
        { status: 429 }
      );
    }

    await db
      .collection("open-ai-limit")
      .updateOne({ ipHash: hash }, { $set: { count: prevCount + 1 } });
  }

  const userPrompt = req.body.prompt;

  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: SURVEY_CREATION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `description for the survey: ${userPrompt}`,
      },
    ],
    model: "gpt-3.5-turbo",
    max_tokens: 300,
    temperature: 0.0,
  });

  res.json({ survey: response.choices[0].message.content });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
