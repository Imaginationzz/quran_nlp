import "./globals.css";

export const viewport = {
    themeColor: "#ffffff",
};

export const metadata = {
    title: "Al-Bayan: AI Quran Tafseer & Quranic Intelligence | بوابة البيان - تفسير القرآن Tafseer Quran",
    description: "Al-Bayan is a general purpose, NLP-powered platform for AI Quran Tafseer, vocabulary learning, morphological analysis, and Surah purposes (maqasid / مقاصد السور). Created by Muslim Wings.",
    keywords: [
        "تفسير القرآن Tafseer Quran",
        "AI Quran Tafseer",
        "General purpose",
        "maqasid",
        "مقاصد السور",
        "muslim wings",
        "Al-Bayan",
        "Quranic Intelligence",
        "Quranic vocabulary",
        "morphological analysis",
        "semantic knowledge graphs"
    ],
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Al-Bayan",
    },
    formatDetection: {
        telephone: false,
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="ar" dir="ltr">
            <body>
                {children}
            </body>
        </html>
    );
}
