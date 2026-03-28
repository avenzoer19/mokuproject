const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function callGemini(systemPrompt, userMessage, media = []) {
  if (!API_KEY) return "Error: API Key belum dikonfigurasi.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  const parts = [{ text: `${systemPrompt}\n\nUser Request:\n${userMessage}` }];
  media.forEach(m => parts.push({ inlineData: { mimeType: m.type, data: m.data } }));
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    });
    const d = await res.json();
    if (d.error) return `Error: ${d.error.message}`;
    return d.candidates?.[0]?.content?.parts?.[0]?.text || "Error: Tidak ada respons.";
  } catch (e) {
    return `Error koneksi: ${e.message}`;
  }
}

export async function searchCrossRef(query, rows = 5) {
  try {
    const r = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${rows}&filter=from-pub-date:2021&sort=relevance`);
    const d = await r.json();
    return (d.message?.items || []).map(i => ({
      title: i.title?.[0] || "Untitled",
      authors: (i.author || []).map(a => `${a.family || ""}, ${a.given?.[0] || ""}.`).slice(0, 3).join(", "),
      year: i.published?.["date-parts"]?.[0]?.[0] || "n.d.",
      doi: i.DOI || "",
      journal: i["container-title"]?.[0] || "",
      abstract: i.abstract || "",
      tier: i.abstract ? "abstract" : "metadata",
      source: "CrossRef",
    }));
  } catch {
    return [];
  }
}
