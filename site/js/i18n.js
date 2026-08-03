(function () {
  const SUPPORTED = ["sr-Cyrl", "sr-Latn", "en"];
  const DEFAULT_LANG = "sr-Cyrl";
  const STORAGE_KEY = "copor-lang";
  const dictCache = {};

  function currentLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(stored) ? stored : DEFAULT_LANG;
  }

  async function loadDict(lang) {
    if (dictCache[lang]) return dictCache[lang];
    const res = await fetch(`i18n/${lang}.json`);
    if (!res.ok) throw new Error(`Failed to load i18n/${lang}.json`);
    const dict = await res.json();
    dictCache[lang] = dict;
    return dict;
  }

  function applyDict(dict) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    // Trusted, author-controlled strings only (e.g. a citation link) - never
    // used for user-supplied content.
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
  }

  function updateSwitchButtons(lang) {
    document.querySelectorAll(".lang-switch button[data-lang]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    const dict = await loadDict(lang);
    applyDict(dict);
    updateSwitchButtons(lang);
    document.documentElement.setAttribute(
      "lang",
      lang === "en" ? "en" : "sr"
    );
    localStorage.setItem(STORAGE_KEY, lang);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setLang(currentLang());
    document.querySelectorAll(".lang-switch button[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
    });
  });
})();
