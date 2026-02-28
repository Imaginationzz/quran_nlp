const ARABIC_TO_BUCKWALTER = {
    'ا': 'A', 'ب': 'b', 'ت': 't', 'ث': 'v', 'ج': 'j', 'ح': 'H', 'خ': 'x',
    'د': 'd', 'ذ': '*', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': '$', 'ص': 'S',
    'ض': 'D', 'ط': 'T', 'ظ': 'Z', 'ع': 'E', 'غ': 'g', 'ف': 'f', 'q': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'h': 'h', 'و': 'w', 'ي': 'y',
    'ء': "'", 'أ': '>', 'ؤ': '&', 'إ': '<', 'ئ': '}', 'آ': '|', 'ى': 'Y', 'ة': 'p',
    '\u064E': 'a', '\u064F': 'u', '\u0650': 'i', '\u0652': 'o', '\u0651': '~',
    '\u064B': 'F', '\u064C': 'N', '\u064D': 'K', '\u0670': '`', '\u0653': '^'
};

const BUCKWALTER_TO_ARABIC = {
    'A': 'ا', 'b': 'ب', 't': 'ت', 'v': 'ث', 'j': 'ج', 'H': 'ح', 'x': 'خ',
    'd': 'د', '*': 'ذ', 'r': 'ر', 'z': 'ز', 's': 'س', '$': 'ش', 'S': 'ص',
    'D': 'ض', 'T': 'ط', 'Z': 'ظ', 'E': 'ع', 'g': 'غ', 'f': 'ف', 'q': 'ق',
    'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'h': 'ه', 'w': 'و', 'y': 'ي',
    "'": 'ء', '>': 'أ', '&': 'ؤ', '<': 'إ', '}': 'ئ', '|': 'آ', 'Y': 'ى', 'p': 'ة',
    'a': '\u064E', 'u': '\u064F', 'i': '\u0650', 'o': '\u0652', '~': '\u0651',
    'F': '\u064B', 'N': '\u064C', 'K': '\u064D', '`': '\u0670', '^': '\u0653',
    '{': 'ا', '@': '', '#': '', '_': ''
};

export function cleanArabic(text) {
    if (!text) return text;
    // Strip Buckwalter artifacts and other non-standard characters sometimes leaked from corpus
    return text.replace(/[@#_]/g, '');
}

const ROOT_ALIASES = {
    'ETw': 'ETy', // أعطى: standard dictionary root is ETy (عـطـي)
};

export const POS_MAP = {
    'N': 'اسم',
    'PN': 'اسم علم',
    'V': 'فعل',
    'ADJ': 'صفة',
    'PRON': 'ضمير',
    'DET': 'أداة تعريف',
    'P': 'حرف جر',
    'CONJ': 'حرف عطف',
    'T': 'ظرف زمان',
    'LOC': 'ظرف مكان',
    'EMPH': 'لام التوكيد',
    'IMPV': 'أمر',
    'PRP': 'حرف تعليل',
    'NEG': 'حرف نفي',
    'INTG': 'حرف استفهام',
    'VOC': 'حرف نداء',
    'REM': 'واو الاستئنافية',
    'RES': 'أداة حصر',
    'PREV': 'حرف تشبيه',
    'INL': 'حروف مقطعة',
    'ACC': 'حرف نصب',
    'COND': 'حرف شرط',
    'SUB': 'حرف مصدري',
    'FUT': 'حرف استقبال',
    'ANS': 'حرف جواب',
    'PRO': 'حرف نهي',
    'REL': 'اسم موصول',
    'DEM': 'اسم إشارة',
    'EXP': 'أداة استثناء',
    'SUP': 'حرف زائد',
    'RET': 'حرف إضراب',
    'SUR': 'حرف فجاءة',
    'INT': 'حرف تنبيه',
    'AVR': 'حرف ردع',
    'CERT': 'حرف تحقيق',
    'EXH': 'حرف تحضيض',
    'EXL': 'حرف تفسير',
    'INC': 'حرف ابتداء',
    'IMPN': 'اسم فعل أمر',
};

export const FEATURE_MAP = {
    'POS': 'نوع الكلمة',
    'LEM': 'الكلمة الأصلية',
    'ROOT': 'الجذر',
    'M': 'مذكر',
    'F': 'مؤنث',
    'S': 'مفرد',
    'D': 'مثنى',
    'P': 'جمع',
    '1': 'متكلم',
    '2': 'مخاطب',
    '3': 'غائب',
    'ACC': 'منصوب',
    'NOM': 'مرفوع',
    'GEN': 'مجرور',
    'PERF': 'ماض',
    'IMPF': 'مضارع',
    'STEM': 'جذع',
    'PREFIX': 'سابقة',
    'SUFFIX': 'لاحقة',
    'MP': 'جمع مذكر',
    'FP': 'جمع مؤنث',
    'MS': 'مذكر مفرد',
    'FS': 'مؤنث مفرد',
    'ACT': 'اسم فاعل',
    'PASS': 'اسم مفعول',
    'PCPL': 'مشتق',

    // Values
    '1P': 'نحن (جمع متكلم)',
    '1S': 'أنا (مفرد متكلم)',
    '2MS': 'أنت (مذكر مفرد)',
    '2FS': 'أنتِ (مؤنث مفرد)',
    '2MP': 'أنتم (مذكر جمع)',
    '3MS': 'هو (مذكر مفرد)',
    '3FS': 'هي (مؤنث مفرد)',
    '3MP': 'هم (مذكر جمع)',
};

/**
 * Translates a morphological tag or feature to Arabic.
 * @param {string} key Tag or feature key
 * @param {string} type 'pos' or 'feature'
 */
export function translateMorph(key, type = 'feature') {
    const map = type === 'pos' ? POS_MAP : FEATURE_MAP;
    return map[key] || key;
}

export const SURAH_NAMES = [
    "", "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازات", "عبس", "التكوير", "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"
];

export function stripDiacritics(text) {
    if (!text) return text;
    // Unicode range for Arabic diacritics
    return text.replace(/[\u064B-\u0652\u0670\u0653]/g, '');
}

export function toBuckwalter(text, normalize = false) {
    if (!text) return text;
    let processed = text;
    if (normalize) {
        processed = stripDiacritics(processed);
    }
    return processed.split('').map(char => ARABIC_TO_BUCKWALTER[char] || char).join('');
}

/**
 * Converts Buckwalter transliteration back to Arabic script.
 * @param {string} text Buckwalter text
 * @param {boolean} isRoot If true, applies root aliases for conventional display.
 */
export function fromBuckwalter(text, isRoot = false) {
    if (!text) return text;
    let processed = text;
    if (isRoot && ROOT_ALIASES[text]) {
        processed = ROOT_ALIASES[text];
    }
    return processed.split('').map(char => BUCKWALTER_TO_ARABIC[char] || char).join('');
}
