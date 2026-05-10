import "./globals.css";

export const viewport = {
    themeColor: "#ffffff",
};

export const metadata = {
    title: "Al-Bayan Quranic Intelligence | بوابة البيان",
    description: "NLP-powered Quranic vocabulary learning platform with morphological analysis and semantic knowledge graphs.",
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
