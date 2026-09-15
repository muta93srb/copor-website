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

  // ---- lightbox ----
  // Shared by the gallery and the loadout items.
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  // Each slide is { src, alt, label }; label is optional, already-translated caption text.
  let slides = [];
  let currentIndex = 0;
  let returnFocus = null;

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    const slide = slides[currentIndex];
    lightboxImage.src = slide.src;
    lightboxImage.alt = slide.alt;
    const counter = `${currentIndex + 1} / ${slides.length}`;
    lightboxCaption.textContent = slide.label ? `${slide.label} · ${counter}` : counter;
  }

  function openLightbox(items, index) {
    slides = items;
    returnFocus = document.activeElement;
    showSlide(index);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    if (returnFocus) returnFocus.focus();
  }

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", () => showSlide(currentIndex - 1));
  if (lightboxNext) lightboxNext.addEventListener("click", () => showSlide(currentIndex + 1));
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (!lightbox || !lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showSlide(currentIndex - 1);
    if (e.key === "ArrowRight") showSlide(currentIndex + 1);
  });

  // ---- gallery ----
  const grid = document.getElementById("galleryGrid");
  const emptyMsg = document.getElementById("galleryEmpty");
  const errorMsg = document.getElementById("galleryError");

  let images = [];

  function renderGallery() {
    if (!grid) return;
    grid.innerHTML = "";
    // No label: the manifest captions come from filenames, and a counter alone keeps Latin text out of Cyrillic mode.
    const gallerySlides = images.map((item) => ({ src: `gallery/images/${item.file}`, alt: item.caption || item.file }));
    images.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", item.caption || item.file);
      const img = document.createElement("img");
      img.src = `gallery/images/${item.file}`;
      img.alt = item.caption || item.file;
      img.loading = "lazy";
      btn.appendChild(img);
      btn.addEventListener("click", () => openLightbox(gallerySlides, index));
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

  // ---- loadout ----
  // Arrows in the lightbox step through the same member's items.
  document.querySelectorAll(".loadout-card").forEach((card) => {
    const items = [...card.querySelectorAll(".loadout-item[data-img]")];
    items.forEach((item, index) => {
      item.addEventListener("click", () => {
        // Captions are read from the rendered text on each click, so they follow the active language.
        const member = card.querySelector(".member-callsign").textContent || card.querySelector(".member-name").textContent;
        const loadoutSlides = items.map((el) => {
          const slot = el.querySelector(".loadout-slot").textContent;
          const value = el.querySelector(".loadout-value").textContent;
          const label = `${member} — ${value ? `${slot}: ${value}` : slot}`;
          return { src: el.dataset.img, alt: label, label };
        });
        openLightbox(loadoutSlides, index);
      });
    });
  });

  // ---- fields map ----
  // Leaflet is only fetched once the map is about to scroll into view.
  const mapEl = document.getElementById("fieldsMap");
  if (mapEl) {
    const LEAFLET_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";

    function initMap() {
      // Fractional zoom lets fitBounds frame the fields tightly instead of snapping far out.
      const map = L.map(mapEl, { scrollWheelZoom: false, keyboard: false, zoomSnap: 0.25 });
      // Drop the optional "Leaflet" credit; the required OpenStreetMap attribution stays.
      map.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(map);

      const points = [];
      document.querySelectorAll(".field-card[data-lat]").forEach((card, index) => {
        const point = [Number(card.dataset.lat), Number(card.dataset.lng)];
        points.push(point);
        const icon = L.divIcon({
          className: "",
          html: `<span class="num-badge map-marker">${index + 1}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });
        // Built from the card when opened, so the popup follows the active language.
        const popup = () => {
          const content = document.createElement("div");
          ["h3", "p", "a"].forEach((tag) => content.appendChild(card.querySelector(tag).cloneNode(true)));
          return content;
        };
        L.marker(point, { icon, keyboard: false }).bindPopup(popup).addTo(map);
      });
      map.fitBounds(points, { padding: [30, 30] });

      if ("ResizeObserver" in window) {
        new ResizeObserver(() => map.invalidateSize()).observe(mapEl);
      }
    }

    function loadLeaflet() {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = LEAFLET_URL + "leaflet.min.css";
      css.integrity = "sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw==";
      css.crossOrigin = "anonymous";
      document.head.appendChild(css);

      const script = document.createElement("script");
      script.src = LEAFLET_URL + "leaflet.min.js";
      script.integrity = "sha512-puJW3E/qXDqYp9IfhAI54BJEaWIfloJ7JWs7OeD5i6ruC9JZL1gERT1wjtwXFlh7CjE7ZJ+/vcRZRkIYIb6p4g==";
      script.crossOrigin = "anonymous";
      script.onload = initMap;
      // The field list already has every location, so just drop the map if the CDN fails.
      script.onerror = () => mapEl.parentElement.classList.add("no-map");
      document.head.appendChild(script);
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            loadLeaflet();
          }
        },
        { rootMargin: "400px" }
      );
      observer.observe(mapEl);
    } else {
      loadLeaflet();
    }
  }
})();
