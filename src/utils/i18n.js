// i18n.js
const messages = {
    ru: {
        ui: { langToggle: "EN" },
        title: "Шаблон",
        btn1: "Кнопка 1",
        settings: "Настройки",
        back: "Назад",
        start_game_btn: "Начать игру",
    },
    en: {
        ui: { langToggle: "RU" },
        title: "Template",
        btn1: "btn1",
        settings: "settings",
        back: "back",
        start_game_btn: "Start Game",
    }
};

function get(obj, path) { return path.split('.').reduce((o, k) => o && o[k], obj); }

export function applyTranslations(locale = 'ru', root = document) {
    const dict = messages[locale] || messages.ru;

    root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const val = get(dict, key);
        if (val != null) el.textContent = val; // fallback останется, если ключа нет
    });

    document.documentElement.lang = locale;
    localStorage.setItem('locale', locale);

    // обновим текст на кнопке
    const btn = document.getElementById('lang-toggle');

    if (btn) {
        const flag = document.getElementById('flag');
        if (get(dict, 'ui.langToggle') === 'ru' || (locale === 'ru')) {

            flag.classList.remove('us');
            flag.classList.add('ru');
            flag.src = "images/ru.svg"


        }
        else {
            flag.classList.remove('ru');
            flag.classList.add('us');
            flag.src = "images/us.svg"
        }
    }
}

export function initI18n(lang) {
    if (lang != undefined) {
        applyTranslations(lang);
    }
    else {
        const saved = localStorage.getItem('locale') || 'ru';
        applyTranslations(saved);
    }
    const toggle = document.getElementById('lang-toggle');
    const flag = document.getElementById('flag');

    if (toggle) {
        toggle.addEventListener('click', () => {
            const curr = localStorage.getItem('locale') || 'ru';
            const next = curr === 'ru' ? 'en' : 'ru';
            applyTranslations(next);
        })
    }
}


export function t(path, fallback = "") {
    const locale = localStorage.getItem('locale') || 'ru';
    const dict = messages[locale] || messages.ru;
    const val = path.split('.').reduce((o, k) => (o && o[k]), dict);
    return (val ?? fallback);
}