import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const WISHLIST_KEY = "prisma_wishlist";
const WHATSAPP_NUMBER = "13144013488";
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"); }
  catch { return []; }
}
function setWishlist(items) { localStorage.setItem(WISHLIST_KEY, JSON.stringify(items)); }
function isSaved(id) { return getWishlist().includes(id); }
function toggleWishlist(id) {
  const current = getWishlist();
  const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
  setWishlist(next);
  renderDestinations();
  return next.includes(id);
}
window.PRISMA_WISHLIST = { getWishlist, toggleWishlist };

function offerWhatsAppUrl(offer) {
  const publishedPrice = offer.discountPriceLabel || offer.priceLabel;
  const text = `Hola Prisma Agency, quiero información sobre la oferta de ${offer.name}.\n\nOferta: ${offer.service}\nPrecio publicado: ${publishedPrice}\nOrigen: La Habana, Cuba.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function renderHeader() {
  const host = $("#siteHeader");
  if (!host) return;
  host.innerHTML = `
    <header class="site-header"><div class="container nav">
      <a class="brand" href="index.html">Prisma <span>Agency</span></a>
      <button class="menu-toggle" type="button" aria-label="Abrir menú">☰</button>
      <nav><ul class="nav-links">
        <li><a href="index.html#destinos">Destinos</a></li><li><a href="index.html#nosotros">Nosotros</a></li>
        <li><a href="index.html#testimonios">Testimonios</a></li><li><a href="index.html#viajar">VIAJAR</a></li>
      </ul></nav>
      <div class="nav-actions"><a class="btn btn--ghost" href="login.html" id="accountLink">Acceder</a></div>
    </div></header>`;
  $(".menu-toggle", host)?.addEventListener("click", () => $(".nav-links", host)?.classList.toggle("is-open"));
  onAuthStateChanged(auth, user => {
    const link = $("#accountLink");
    if (!link) return;
    if (user) {
      const name = (user.displayName || "").trim() || (user.email || "").split("@")[0] || "Cliente";
      link.textContent = `Hola, ${name}`;
      link.href = "perfil.html";
      link.setAttribute("aria-label", `Abrir perfil de ${name}`);
    } else {
      link.textContent = "Acceder";
      link.href = "login.html";
      link.removeAttribute("aria-label");
    }
  });
}

function renderFooter() {
  const host = $("#siteFooter");
  if (host) host.innerHTML = `<footer class="site-footer"><div class="container footer-inner"><span>© ${new Date().getFullYear()} Prisma Agency</span><span>Viajes · Visados · Hoteles · Asistencia</span></div></footer>`;
}

function renderDestinations() {
  const grid = $("#destinationGrid");
  if (!grid || !Array.isArray(window.PRISMA_DESTINATIONS)) return;
  const text = ($("#filterDestination")?.value || "").trim().toLowerCase();
  const maxPrice = Number($("#filterPrice")?.value || 0);
  const from = $("#filterDateFrom")?.value || "";
  const to = $("#filterDateTo")?.value || "";
  const filtered = window.PRISMA_DESTINATIONS.filter(offer => {
    const matchText = !text || offer.name.toLowerCase().includes(text) || offer.service.toLowerCase().includes(text);
    return matchText && (!maxPrice || (offer.price !== null && offer.price <= maxPrice)) && (!from || offer.dateTo >= from) && (!to || offer.dateFrom <= to);
  });
  const count = $("#resultsCount");
  if (count) count.textContent = `${filtered.length} destino${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}.`;
  grid.innerHTML = filtered.length ? filtered.map(offer => `
    <article class="destination-card"><div class="destination-card__image" style="background-image:url('${offer.flag}')">
      <button class="heart-btn ${isSaved(offer.id) ? "is-saved" : ""}" data-wishlist="${offer.id}" type="button" aria-label="${isSaved(offer.id) ? "Quitar" : "Guardar"} ${offer.name}">${isSaved(offer.id) ? "♥" : "♡"}</button>
    </div><div class="destination-card__body"><h3>${offer.name}</h3><p>${offer.service} · ${offer.time}</p>
      <div class="destination-card__footer"><span class="price">${offer.discountPriceLabel ? `<span class="price__original">${offer.priceLabel}</span><span class="price__discount">${offer.discountPriceLabel}</span><small class="price__deadline">Rebaja hasta mañana</small>` : offer.priceLabel}</span><div class="destination-card__actions"><button class="small-link" data-detail="${offer.id}" type="button">Ver detalles</button><a class="small-link" href="${offerWhatsAppUrl(offer)}" target="_blank" rel="noopener noreferrer">WhatsApp →</a></div></div>
    </div></article>`).join("") : `<div class="card-surface" style="grid-column:1/-1;padding:30px"><p>No hay destinos que coincidan con los filtros.</p></div>`;
  $$('[data-wishlist]', grid).forEach(button => button.addEventListener("click", () => {
    const saved = toggleWishlist(button.dataset.wishlist);
    showToast(saved ? "Oferta guardada en tu wishlist." : "Oferta eliminada de tu wishlist.");
  }));
  $$('[data-detail]', grid).forEach(button => button.addEventListener("click", () => openDestination(button.dataset.detail)));
}

function openDestination(id) {
  const offer = window.PRISMA_DESTINATIONS?.find(item => item.id === id);
  const root = $("#modalRoot");
  if (!offer || !root) return;
  root.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true" aria-labelledby="detailTitle"><div class="modal__hero" style="background-image:url('${offer.flag}')"><button class="modal__close" type="button" data-close-modal aria-label="Cerrar">×</button><div><h2 id="detailTitle">${escapeHtml(offer.name)}</h2><p>${escapeHtml(offer.priceLabel)}</p></div></div><div class="modal__body"><p>${escapeHtml(offer.service)} · ${escapeHtml(offer.time)}</p><div class="detail-grid"><div class="detail-box"><small>Pago</small><strong>50% inicial / saldo según proceso</strong></div><div class="detail-box"><small>Tiempo estimado</small><strong>${escapeHtml(offer.time)}</strong></div></div><h3>Qué incluye</h3><ul class="detail-list">${offer.include.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${offer.requirements.length ? `<h3 style="margin-top:22px">Requisitos</h3><ul class="detail-list">${offer.requirements.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}${offer.note ? `<div class="notice" style="margin-bottom:20px">${escapeHtml(offer.note)}</div>` : ""}<a class="btn btn--primary btn--wide" href="${offerWhatsAppUrl(offer)}" target="_blank" rel="noopener noreferrer">Solicitar información por WhatsApp</a></div></section></div>`;
  root.querySelectorAll("[data-close-modal]").forEach(element => element.addEventListener("click", event => { if (event.target.matches("[data-close-modal]")) root.innerHTML = ""; }));
}

function initFilters() {
  ["filterDestination", "filterPrice", "filterDateFrom", "filterDateTo"].forEach(id => $("#" + id)?.addEventListener("input", renderDestinations));
  $("#clearFilters")?.addEventListener("click", () => {
    ["filterDestination", "filterPrice", "filterDateFrom", "filterDateTo"].forEach(id => { const field = $("#" + id); if (field) field.value = ""; });
    renderDestinations();
  });
}

function initCountdown() {
  const element = $("#countdown");
  if (!element) return;
  let target = localStorage.getItem("prisma_flash_deadline");
  if (!target || Number(target) <= Date.now()) { target = String(Date.now() + 72 * 60 * 60 * 1000); localStorage.setItem("prisma_flash_deadline", target); }
  const flashOffers = $("#flashOffers");
  let offersVisible = true;
  const tick = () => {
    let remaining = Number(target) - Date.now();
    if (remaining <= 0) {
      remaining = 0;
      if (flashOffers && offersVisible) { flashOffers.classList.add("hidden"); offersVisible = false; }
      target = String(Date.now() + 72 * 60 * 60 * 1000);
      localStorage.setItem("prisma_flash_deadline", target);
    }
    ["days", "hours", "minutes", "seconds"].forEach((unit, index) => {
      const duration = [86400000, 3600000, 60000, 1000][index];
      const value = Math.floor(remaining / duration); remaining %= duration;
      const field = $(`[data-unit="${unit}"]`, element); if (field) field.textContent = String(value).padStart(2, "0");
    });
  };
  tick(); setInterval(tick, 1000);
}

function initTestimonials() {
  const track = $("#testimonialTrack"), dots = $("#carouselDots");
  if (!track || !dots) return;
  const testimonials = [["Nos guiaron desde la documentación hasta la reserva. Todo fue mucho más claro de lo que esperaba.", "María G. · Viaje internacional"], ["La atención fue rápida y siempre supimos cuál era el siguiente paso.", "Carlos R. · Gestión de viaje"], ["El acompañamiento hizo la diferencia. Volvería a trabajar con Prisma Agency.", "Daniela P. · Servicio personalizado"]];
  let index = 0;
  const render = () => { const item = testimonials[index]; track.innerHTML = `<article class="testimonial"><blockquote>“${item[0]}”</blockquote><footer>${item[1]}</footer></article>`; dots.innerHTML = testimonials.map((_, i) => `<button class="dot ${i === index ? "is-active" : ""}" data-index="${i}" aria-label="Testimonio ${i + 1}"></button>`).join(""); $$(".dot", dots).forEach(dot => dot.onclick = () => { index = Number(dot.dataset.index); render(); }); };
  $(".carousel-btn--prev")?.addEventListener("click", () => { index = (index - 1 + testimonials.length) % testimonials.length; render(); });
  $(".carousel-btn--next")?.addEventListener("click", () => { index = (index + 1) % testimonials.length; render(); });
  render();
}

function initSocial() {
  const grid = $("#socialGrid"); if (!grid) return;
  const reels = [
    "https://www.instagram.com/reel/DcHUQcakcoM/",
    "https://www.instagram.com/reel/DcB26qlE5IJ/",
    "https://www.instagram.com/reel/DcBgQ84I-pk/",
    "https://www.instagram.com/reel/Db1hv_BkhU7/",
    "https://www.instagram.com/reel/DbyyC6BNuZL/"
  ];
  const profileUrl = "https://www.instagram.com/prismaagencycuba/";
  const profileLink = $("#instagram .btn");
  if (profileLink) { profileLink.href = profileUrl; profileLink.target = "_blank"; profileLink.rel = "noopener noreferrer"; }
  grid.innerHTML = reels.map((url, itemIndex) => `<article class="social-tile social-tile--instagram"><blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"><a href="${url}" target="_blank" rel="noopener noreferrer">Ver video ${itemIndex + 1} de Prisma Agency en Instagram</a></blockquote></article>`).join("");
  const processEmbeds = () => window.instgrm?.Embeds?.process?.();
  const instagramScript = document.querySelector('script[src*="instagram.com/embed.js"]');
  if (window.instgrm?.Embeds) processEmbeds(); else instagramScript?.addEventListener("load", processEmbeds, { once: true });
}

function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }

function initPrismaAssistant() {
  const root = $("#prismaAssistant"); if (!root) return;
  try {
    const messages = $("#assistantMessages"), options = $("#assistantOptions"), progress = $("#assistantProgressBar");
    const destinations = Array.isArray(window.PRISMA_DESTINATIONS) ? window.PRISMA_DESTINATIONS.filter(offer => offer?.name) : [];
    if (!messages || !options || !progress) return;
    const state = { step: 0, destination: null, service: "", date: "", travelers: "" };
    const addMessage = (text, who = "bot") => { const item = document.createElement("div"); item.className = `assistant-msg ${who}`; item.textContent = text; messages.appendChild(item); messages.scrollTop = messages.scrollHeight; };
    const setProgress = () => { progress.style.width = `${Math.max(8, Math.min(100, state.step * 25))}%`; };
    const renderOptions = items => { options.innerHTML = ""; items.forEach(item => { const button = document.createElement("button"); button.type = "button"; button.className = "assistant-option"; button.textContent = item.label; button.addEventListener("click", () => answer(item)); options.appendChild(button); }); };
    const askDestination = () => { state.step = 0; setProgress(); addMessage("¿A qué país quieres viajar? Estas son las ofertas disponibles actualmente:"); if (!destinations.length) { addMessage("No hay ofertas cargadas en este momento. Escríbenos por WhatsApp para ayudarte."); return; } renderOptions(destinations.map(offer => ({ label: offer.name, value: offer }))); };
    const askService = () => { state.step = 1; setProgress(); addMessage("¿Qué necesitas para tu viaje?"); renderOptions([{ label: "Visa / Visado", value: "Visa / Visado" }, { label: "Vuelo", value: "Vuelo" }, { label: "Hotel", value: "Hotel" }, { label: "Paquete completo", value: "Paquete completo" }]); };
    const askDate = () => { state.step = 2; setProgress(); addMessage("¿Cuándo tienes pensado viajar?"); renderOptions(["Próximamente", "En 1-3 meses", "En 4-6 meses", "Aún no lo sé"].map(value => ({ label: value, value }))); };
    const askTravelers = () => { state.step = 3; setProgress(); addMessage("¿Cuántas personas viajarán?"); renderOptions(["1 persona", "2 personas", "3-4 personas", "5 o más"].map(value => ({ label: value, value }))); };
    const finish = () => {
      state.step = 4; setProgress(); options.innerHTML = "";
      const offer = state.destination;
      const publishedPrice = offer.discountPriceLabel || offer.priceLabel;
      const text = `Hola Prisma Agency, quiero información sobre mi viaje.\n\nOrigen: La Habana, Cuba\nDestino: ${offer.name}\nOferta: ${offer.service}\nServicio de interés: ${state.service}\nFecha: ${state.date}\nViajeros: ${state.travelers}\nPrecio publicado: ${publishedPrice}`;
      const result = document.createElement("div"); result.className = "assistant-msg bot";
      result.innerHTML = `<div class="assistant-result"><strong>Tu viaje está listo para consultar</strong><div class="assistant-result__row"><span>Origen</span><b>La Habana, Cuba</b></div><div class="assistant-result__row"><span>Destino</span><b>${escapeHtml(offer.name)}</b></div><div class="assistant-result__row"><span>Oferta</span><b>${escapeHtml(offer.service)}</b></div><div class="assistant-result__row"><span>Fecha</span><b>${escapeHtml(state.date)}</b></div><div class="assistant-result__row"><span>Viajeros</span><b>${escapeHtml(state.travelers)}</b></div><div class="assistant-result__row"><span>Precio de la oferta</span><b>${escapeHtml(offer.discountPriceLabel || offer.priceLabel)}</b></div><div class="assistant-actions"><a class="btn btn--primary" href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener noreferrer">Continuar por WhatsApp</a></div></div>`;
      messages.appendChild(result); messages.scrollTop = messages.scrollHeight;
    };
    const answer = item => { options.innerHTML = ""; if (state.step === 0) { state.destination = item.value; addMessage(item.label, "user"); setTimeout(askService, 160); } else if (state.step === 1) { state.service = item.value; addMessage(item.label, "user"); setTimeout(askDate, 160); } else if (state.step === 2) { state.date = item.value; addMessage(item.label, "user"); setTimeout(askTravelers, 160); } else if (state.step === 3) { state.travelers = item.value; addMessage(item.label, "user"); setTimeout(finish, 160); } };
    askDestination();
  } catch (error) { console.error("Asistente Prisma:", error); }
}

function initWhatsAppFloat() {
  if (document.querySelector("[data-prisma-whatsapp]")) return;
  const link = document.createElement("a"); link.className = "prisma-whatsapp-float"; link.href = `https://wa.me/${WHATSAPP_NUMBER}`; link.target = "_blank"; link.rel = "noopener noreferrer"; link.dataset.prismaWhatsapp = ""; link.setAttribute("aria-label", "Contactar a Prisma Agency por WhatsApp"); link.innerHTML = "✆"; document.body.appendChild(link);
}

function showToast(text) { const toast = $("#toast"); if (!toast) return; toast.textContent = text; toast.classList.add("is-visible"); setTimeout(() => toast.classList.remove("is-visible"), 2500); }

renderHeader(); renderFooter(); renderDestinations(); initFilters(); initCountdown(); initTestimonials(); initSocial(); initPrismaAssistant(); initWhatsAppFloat();
