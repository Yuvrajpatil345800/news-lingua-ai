import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const summarizeNews = async (text) => {
  try {
    if (!text || text.trim() === "") {
      return "No content available.";
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an AI news summarizer. Summarize articles in 3 concise sentences.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Groq Error:", error);
    return "Summary not available.";
  }
};