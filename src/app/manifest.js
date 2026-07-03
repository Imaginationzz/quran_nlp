export default function manifest() {
  return {
    name: "Al-Bayan: AI Quran Tafseer & Quranic Intelligence | بوابة البيان",
    short_name: "Al-Bayan",
    description: "Al-Bayan is a general purpose, NLP-powered platform for AI Quran Tafseer, morphological analysis, semantic knowledge graphs, and Surah purposes (maqasid / مقاصد السور). Created by Muslim Wings.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
