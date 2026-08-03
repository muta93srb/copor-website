(function () {
  // ---- mobile nav ----
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    const setOpen = (open) => {
      mainNav.classList.toggle("open", open);
      navToggle.classList.toggle("open", open);
      navToggle.textContent = open ? "✕" : "☰";
      navToggle.setAttribute("aria-expanded", String(open));
    };
    navToggle.addEventListener("click", () => setOpen(!mainNav.classList.contains("open")));
    mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  }

  // ---- theme toggle ----
  const THEME_KEY = "copor-theme";
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const applyTheme = (theme) => {
      if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        themeToggle.textContent = "☀";
      } else {
        document.documentElement.removeAttribute("data-theme");
        themeToggle.textContent = "☾";
      }
      themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    };
    applyTheme(localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark");
    themeToggle.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  // ---- gallery ----
  const grid = document.getElementById("galleryGrid");
  const emptyMsg = document.getElementById("galleryEmpty");
  const errorMsg = document.getElementById("galleryError");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  let images = [];
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    const item = images[currentIndex];
    lightboxImage.src = `gallery/images/${item.file}`;
    lightboxImage.alt = item.caption || item.file;
    lightboxCaption.textContent = item.caption || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
  }

  function showRelative(delta) {
    currentIndex = (currentIndex + delta + images.length) % images.length;
    openLightbox(currentIndex);
  }

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", () => showRelative(-1));
  if (lightboxNext) lightboxNext.addEventListener("click", () => showRelative(1));
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (!lightbox || !lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showRelative(-1);
    if (e.key === "ArrowRight") showRelative(1);
  });

  function renderGallery() {
    if (!grid) return;
    grid.innerHTML = "";
    images.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", item.caption || item.file);
      const img = document.createElement("img");
      img.src = `gallery/images/${item.file}`;
      img.alt = item.caption || item.file;
      img.loading = "lazy";
      btn.appendChild(img);
      btn.addEventListener("click", () => openLightbox(index));
      grid.appendChild(btn);
    });
  }

  async function loadGallery() {
    try {
      const res = await fetch("gallery/manifest.json", { cache: "no-store" });
      if (!res.ok) throw new Error("manifest not found");
      const data = await res.json();
      images = Array.isArray(data.images) ? data.images : [];
      if (images.length === 0) {
        if (emptyMsg) emptyMsg.hidden = false;
        return;
      }
      renderGallery();
    } catch (err) {
      if (errorMsg) errorMsg.hidden = false;
      console.error("Gallery load failed:", err);
    }
  }

  loadGallery();
})();
