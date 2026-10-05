import { isDatabaseConnected } from "../config/database.js";
import { Summary } from "../models/Summary.js";

const ensureDatabase = () => {
  if (!isDatabaseConnected()) throw new Error("Database unavailable");
};
const serialize = (record) => ({
  id: record.id || record._id.toString(),
  user_id: record.userId.toString(),
  user_email: record.userEmail,
  title: record.title,
  url: record.url,
  original_text: record.originalText,
  summary: record.summary,
  key_points: record.keyPoints,
  sentiment: record.sentiment,
  category: record.category,
  language: record.language,
  created_at: record.createdAt,
});

export const summaryService = {
  async saveSummary({ userId, userEmail, title, url, originalText, summary, keyPoints, sentiment, category, language }) {
    ensureDatabase();
    const record = await Summary.create({
      userId,
      userEmail,
      title,
      url,
      originalText: originalText.slice(0, 500),
      summary,
      keyPoints: Array.isArray(keyPoints) ? keyPoints : [],
      sentiment,
      category,
      language,
    });
    return serialize(record);
  },
  async getUserHistory(userId) {
    ensureDatabase();
    if (!userId) return [];
    return (await Summary.find({ userId }).sort({ createdAt: -1 }).limit(50)).map(serialize);
  },
  async deleteHistory(id, userId) {
    ensureDatabase();
    if (!userId) return false;
    const deleted = await Summary.findOneAndDelete({ _id: id, userId });
    return Boolean(deleted);
  },
};
