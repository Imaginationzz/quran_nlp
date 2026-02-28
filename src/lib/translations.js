export const translations = {
    en: {
        title: "Al-Bayan: Quranic Intelligence",
        subtitle: "Unveiling the Linguistic Gems and Conceptual Depth of the Holy Revelation",
        footer: "Dedicated to the deep exploration of the Divine Word.",
        search: {
            title: "Thematic Search",
            desc: "Semantic AI & Root exploration.",
            placeholder: "Search by ",
            button: "Search",
            loading: "Searching the Quran...",
            modes: {
                keyword: "Keyword",
                root: "Root",
                semantic: "Semantic (AI)"
            }
        },
        explorer: {
            title: "Word Essence",
            desc: "Morphological depth & meaning.",
            surah: "Surah",
            ayah: "Ayah",
            analysis: "Word Analysis",
            meaning: "Word Meaning",
            loading: "Loading Verse..."
        },
        similarity: {
            title: "Verse Mirror",
            desc: "Conceptual duality & connections.",
            verse1: "Verse 1 (Sura:Aya)",
            verse2: "Verse 2 (Sura:Aya)",
            compare: "Compare Verses",
            score: "Semantic Similarity Score",
            loading: "Calculating Similarity..."
        },
        quiz: {
            title: "Context Master",
            desc: "Insight and Tafsir challenge.",
            score: "Score",
            location: "Verse Location",
            nextWord: "Next Word",
            correct: "✨ Correct! Mashallah.",
            wrong: "Oops! The correct root was: ",
            loading: "Preparing next question..."
        },
        concepts: {
            title: "Concept Clusters",
            desc: "Quranic thematic architecture."
        }
    },
    ar: {
        author: "يزيد رحموني",
        title: "بوابة البيان: آفاق التدبر الرقمي",
        subtitle: "تجلي اللطائف اللغوية والعمق الدلالي لآيات الذكر الحكيم",
        footer: "مكرس للتدبر العميق في جواهر آيات الذكر الحكيم.",
        search: {
            title: "آفاق التدبر",
            desc: "استكشاف المعاني والمقاصد الدلالية.",
            placeholder: "بحث عن طريق ",
            button: "بحث",
            loading: "جاري البحث في القرآن...",
            modes: {
                keyword: "كلمة مفتاحية",
                root: "جذر",
                semantic: "دلالي (AI)"
            }
        },
        explorer: {
            title: "جواهر الكلمات",
            desc: "الغوص في عمق الألفاظ ومعانيها.",
            surah: "السورة",
            ayah: "الآية",
            analysis: "تحليل الكلمة",
            meaning: "معنى الكلمة",
            loading: "جاري تحميل الآية..."
        },
        similarity: {
            title: "بصائر الترابط",
            desc: "كشف التناغم والتماثل بين الآيات.",
            verse1: "آية 1 (سورة:آية)",
            verse2: "آية 2 (سورة:آية)",
            compare: "قارن الآيات",
            score: "درجة التشابه الدلالي",
            loading: "جاري حساب التشابه..."
        },
        quiz: {
            title: "مشكاة الفهم",
            desc: "تحدي السياق واستنباط الحكمة.",
            score: "النتيجة",
            location: "موقع الآية",
            nextWord: "الكلمة التالية",
            correct: "✨ صحيح! ما شاء الله.",
            wrong: "عذراً! الجذر الصحيح هو: ",
            loading: "جاري تحضير السؤال..."
        },
        concepts: {
            title: "نسيج الهداية",
            desc: "البنية الموضوعية الكبرى للقرآن."
        }
    }
};

export const getDual = (path) => {
    const keys = path.split('.');
    let enVal = translations.en;
    let arVal = translations.ar;

    for (const key of keys) {
        enVal = enVal[key];
        arVal = arVal[key];
    }

    // For strings, return dual. For objects, it's more complex (recursive), 
    // but we'll use it mostly for strings.
    if (typeof enVal === 'string') {
        return `${enVal} / ${arVal}`;
    }
    return arVal; // fallback for titles/objects if needed
};
