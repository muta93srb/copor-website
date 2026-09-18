(function () {
  const SUPPORTED = ["sr-Cyrl", "sr-Latn", "en"];
  // Where we land when the reader has not chosen and their system says nothing
  // we recognise.
  const DEFAULT_LANG = "sr-Latn";
  // The language the HTML files are written in. When that is the language the
  // reader wants, the markup is already correct and nothing has to be swapped.
  const BAKED_LANG = "sr-Cyrl";
  const STORAGE_KEY = "copor-lang";
  const CACHE_PREFIX = "copor-dict:";
  const PENDING_ATTR = "data-i18n-pending";
  const dictCache = {};

  // Mirrors the resolver in each page's <head>, for the case where that snippet
  // did not get to run.
  function detectLang() {
    const tags =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language];
    for (const raw of tags) {
      const tag = String(raw || "").toLowerCase();
      if (!tag) continue;
      if (tag.startsWith("sr") || tag.startsWith("sh")) {
        return tag.includes("cyrl") ? "sr-Cyrl" : "sr-Latn";
      }
      if (tag.startsWith("en")) return "en";
    }
    return DEFAULT_LANG;
  }

  function currentLang() {
    // The <head> snippet already resolved this; agreeing with it matters,
    // because it is what decided whether the paint is being held.
    const handoff = window.__coporI18n;
    if (handoff && SUPPORTED.includes(handoff.lang)) return handoff.lang;
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}
    return SUPPORTED.includes(stored) ? stored : detectLang();
  }

  function loadDict(lang) {
    if (dictCache[lang]) return Promise.resolve(dictCache[lang]);
    return fetch(`i18n/${lang}.json`).then((res) => {
      if (!res.ok) throw new Error(`Failed to load i18n/${lang}.json`);
      return res.json();
    });
  }

  // Keeping the dictionary in localStorage is what makes moving between pages
  // instant: the next page reads it synchronously in <head> and never has to
  // hold the paint waiting on a request.
  function remember(lang, dict) {
    try {
      localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(dict));
    } catch (e) {}
  }

  function applyTo(el, dict) {
    const key = el.getAttribute("data-i18n");
    if (key !== null && dict[key] !== undefined) el.textContent = dict[key];
    // Trusted, author-controlled strings only (e.g. a citation link) - never
    // used for user-supplied content.
    const htmlKey = el.getAttribute("data-i18n-html");
    if (htmlKey !== null && dict[htmlKey] !== undefined) el.innerHTML = dict[htmlKey];
  }

  function translate(root, dict) {
    if (!root || root.nodeType !== 1 || !dict) return;
    applyTo(root, dict);
    root.querySelectorAll("[data-i18n], [data-i18n-html]").forEach((el) => applyTo(el, dict));
  }

  function updateSwitchButtons(lang) {
    document.querySelectorAll(".lang-switch button[data-lang]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });
  }

  function markLang(lang) {
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "sr");
  }

  function reveal() {
    document.documentElement.removeAttribute(PENDING_ATTR);
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---- first paint ----------------------------------------------------
     The <head> snippet has already handed us whatever it had: a dictionary
     cached from an earlier page (used immediately, so nothing is held) and a
     request for a fresh copy. While the parser is still working, the observer
     below translates each node as it arrives, so the reader never catches
     sight of the Serbian Cyrillic the markup is written in.                */

  const initial = currentLang();
  const handoff = window.__coporI18n;
  const mine = handoff && handoff.lang === initial ? handoff : null;

  let activeDict = null;
  let watcher = null;

  if (initial !== BAKED_LANG) {
    watcher = new MutationObserver((records) => {
      if (!activeDict) return;
      for (const record of records) {
        for (const node of record.addedNodes) translate(node, activeDict);
      }
    });
    watcher.observe(document.documentElement, { childList: true, subtree: true });
  }

  function use(dict) {
    if (!dict) return;
    activeDict = dict;
    dictCache[initial] = dict;
    translate(document.documentElement, dict);
    markLang(initial);
  }

  // 1. A dictionary carried over from the previous page - no network involved.
  if (mine && mine.cached) use(mine.cached);
  if (activeDict) reveal();

  // 2. Settle on the copy from the server, and keep it for the next page.
  const fresh = initial === BAKED_LANG ? Promise.resolve(null) : (mine ? mine.dict : loadDict(initial));

  // Never leave the page hidden because a dictionary failed to arrive.
  const failsafe = activeDict ? null : setTimeout(reveal, 1500);

  Promise.resolve(fresh)
    .catch(() => null)
    .then((dict) => {
      if (dict && JSON.stringify(dict) !== JSON.stringify(activeDict)) {
        use(dict);
        remember(initial, dict);
      }
      if (failsafe) clearTimeout(failsafe);
      reveal();
    });

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  onReady(() => {
    if (watcher) {
      watcher.disconnect();
      watcher = null;
    }
    translate(document.documentElement, activeDict);
    updateSwitchButtons(initial);
    reveal();

    document.querySelectorAll(".lang-switch button[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
    });
  });

  /* ---- switching language at runtime ---- */

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    return loadDict(lang).then((dict) => {
      dictCache[lang] = dict;
      remember(lang, dict);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {}
      const swap = () => {
        activeDict = dict;
        translate(document.documentElement, dict);
        updateSwitchButtons(lang);
        markLang(lang);
      };
      // Cross-fade the swap rather than letting every string jump at once.
      if (document.startViewTransition && !reducedMotion()) {
        document.startViewTransition(swap);
      } else {
        swap();
      }
    });
  }
})();
