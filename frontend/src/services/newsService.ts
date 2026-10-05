const API_URL = "http://localhost:5000/api";

export async function getNews() {
  const response = await fetch(`${API_URL}/news`);

  if (!response.ok) {
    throw new Error("Failed to fetch news");
  }

  return await response.json();
}