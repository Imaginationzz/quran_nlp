export default function manifest() {
  return {
    name: "Al-Bayan Quranic Intelligence | بوابة البيان",
    short_name: "Al-Bayan",
    description: "NLP-powered Quranic vocabulary learning platform with morphological analysis and semantic knowledge graphs.",
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
