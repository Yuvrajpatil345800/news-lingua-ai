import axios from "axios";

export const fetchNews = async () => {
  const apiKey = process.env.NEWS_API_KEY;

  const url = `https://newsapi.org/v2/top-headlines?country=us&category=technology&apiKey=${apiKey}`;

  const response = await axios.get(url);

  return response.data.articles;
};