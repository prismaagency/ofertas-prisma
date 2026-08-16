import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = window.PRISMA_FIREBASE_CONFIG || null;
let auth = null;
if (firebaseConfig && firebaseConfig.apiKey) {
  const firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
}

const WISHLIST_KEY = "prisma_wishlist";
const QUOTES_KEY = "prisma_quotes";

const $ = (selector, scope=document) => scope.querySelector(selector);
const $$ = (selector, scope=document) => [...scope.querySelectorAll(selector)];

function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"); }
  catch { return []; }
}
function setWishlist(items) { localStorage.setItem(WISHLIST_KEY, JSON.stringify(items)); }
function isSaved(id) { return getWishlist().includes(id); }
function toggleWishlist(id) {
  const list = getWishlist();
  const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
  setWishlist(next);
  renderDestinations();
  return next.includes(id);
}
window.PRISMA_WISHLIST = { getWishlist, toggleWishlist };

function renderHeader() {
  const host = $("#siteHeader");
  if (!host) return;
  host.innerHTML = `
    <header class="site-header">
      <div class="container nav">
        <a class="brand" href="index.html">Prisma <span>Agency</span></a>
        <button class="menu-toggle" type="button" aria-label="Abrir menú">☰</button>
        <nav><ul class="nav-links">
          <li><a href="index.html#destinos">Destinos</a></li>
          <li><a href="index.html#nosotros">Nosotros</a></li>
          <li><a href="index.html#testimonios">Testimonios</a></li>
          <li><a href="index.html#cotizacion">Cotización</a></li>
        </ul></nav>
        <div class="nav-actions"><a class="btn btn--ghost" href="login.html" id="accountLink">Acceder</a></div>
      </div>
    </header>`;
  $(".menu-toggle", host)?.addEventListener("click", () => $(".nav-links", host)?.classList.toggle("is-open"));
  if (auth) onAuthStateChanged(auth, user => {
    const link = $("#accountLink");
    if (link) { link.textContent = user ? "Mi perfil" : "Acceder"; link.href = user ? "perfil.html" : "login.html"; }
  });
}
function renderFooter() {
  const host = $("#siteFooter");
  if (!host) return;
  host.innerHTML = `<footer class="site-footer"><div class="container footer-inner"><span>© ${new Date().getFullYear()} Prisma Agency</span><span>Viajes · Visados · Hoteles · Asistencia</span></div></footer>`;
}

function renderDestinations() {
  const grid = $("#destinationGrid");
  if (!grid) return;
  const text = ($("#filterDestination")?.value || "").trim().toLowerCase();
  const maxPrice = Number($("#filterPrice")?.value || 0);
  const from = $("#filterDateFrom")?.value || "";
  const to = $("#filterDateTo")?.value || "";

  const filtered = window.PRISMA_DESTINATIONS.filter(d => {
    const matchText = !text || d.name.toLowerCase().includes(text) || d.service.toLowerCase().includes(text);
    const matchPrice = !maxPrice || (d.price !== null && d.price <= maxPrice);
    const matchFrom = !from || d.dateTo >= from;
    const matchTo = !to || d.dateFrom <= to;
    return matchText && matchPrice && matchFrom && matchTo;
  });

  $("#resultsCount").textContent = `${filtered.length} destino${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}.`;
  grid.innerHTML = filtered.length ? filtered.map(d => `
    <article class="destination-card">
      <div class="destination-card__image" style="background-image:url('${d.flag}')">
        <button class="heart-btn ${isSaved(d.id) ? "is-saved" : ""}" data-wishlist="${d.id}" type="button" aria-label="${isSaved(d.id) ? "Quitar" : "Guardar"} ${d.name}">${isSaved(d.id) ? "♥" : "♡"}</button>
      </div>
      <div class="destination-card__body">
        <h3>${d.name}</h3><p>${d.service} · ${d.time}</p>
        <div class="destination-card__footer"><span class="price">${d.priceLabel}</span><button class="small-link" data-detail="${d.id}" type="button">Ver detalles →</button></div>
      </div>
    </article>`).join("") : `<div class="card-surface" style="grid-column:1/-1;padding:30px"><p>No hay destinos que coincidan con los filtros.</p></div>`;

  $$("[data-wishlist]", grid).forEach(btn => btn.addEventListener("click", () => {
    const saved = toggleWishlist(btn.dataset.wishlist);
    showToast(saved ? "Oferta guardada en tu wishlist." : "Oferta eliminada de tu wishlist.");
  }));
  $$("[data-detail]", grid).forEach(btn => btn.addEventListener("click", () => openDestination(btn.dataset.detail)));
}

function openDestination(id) {
  const d = window.PRISMA_DESTINATIONS.find(x => x.id === id);
  if (!d) return;
  const root = $("#modalRoot");
  root.innerHTML = `<div class="modal-backdrop" data-close-modal>
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="detailTitle">
      <div class="modal__hero" style="background-image:url('${d.flag}')">
        <button class="modal__close" type="button" data-close-modal aria-label="Cerrar">×</button>
        <div><h2 id="detailTitle">${d.name}</h2><p>${d.priceLabel}</p></div>
      </div>
      <div class="modal__body">
        <p>${d.service} · ${d.time}</p>
        <div class="detail-grid"><div class="detail-box"><small>Pago</small><strong>50% inicial / saldo según proceso</strong></div><div class="detail-box"><small>Tiempo estimado</small><strong>${d.time}</strong></div></div>
        <h3>Qué incluye</h3><ul class="detail-list">${d.include.map(x => `<li>${x}</li>`).join("")}</ul>
        ${d.requirements.length ? `<h3 style="margin-top:22px">Requisitos</h3><ul class="detail-list">${d.requirements.map(x => `<li>${x}</li>`).join("")}</ul>` : ""}
        ${d.note ? `<div class="notice" style="margin-bottom:20px">${d.note}</div>` : ""}
        <a class="btn btn--primary btn--wide" href="index.html#cotizacion">Solicitar cotización</a>
      </div>
    </section>
  </div>`;
  $$(".modal-backdrop", root).forEach(el => el.addEventListener("click", e => {
    if (e.target.matches("[data-close-modal]")) root.innerHTML = "";
  }));
}

function initFilters() {
  ["filterDestination","filterPrice","filterDateFrom","filterDateTo"].forEach(id => $("#" + id)?.addEventListener("input", renderDestinations));
  $("#clearFilters")?.addEventListener("click", () => {
    ["filterDestination","filterPrice","filterDateFrom","filterDateTo"].forEach(id => { const el = $("#" + id); if (el) el.value = ""; });
    renderDestinations();
  });
}
function initQuoteForm() {
  const form = $("#quoteForm"); if (!form) return;
  $("#quoteDestination").innerHTML += window.PRISMA_DESTINATIONS.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const msg = $("#quoteMessage");
    const data = Object.fromEntries(new FormData(form).entries());
    const start = new Date(data.startDate), end = new Date(data.endDate);
    if (!form.checkValidity()) { msg.textContent = "Revisa los campos obligatorios."; msg.className = "form-message error"; form.reportValidity(); return; }
    if (end < start) { msg.textContent = "La fecha de regreso debe ser posterior a la salida."; msg.className = "form-message error"; return; }
    const quote = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), ...data, status:"Pendiente", createdAt:new Date().toISOString() };
    const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || "[]"); quotes.unshift(quote); localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
    msg.textContent = "Solicitud guardada. Entra en Mi perfil para consultar su estado.";
    msg.className = "form-message success"; form.reset(); $("#quoteDestination").value = "";
    showToast("Cotización enviada correctamente.");
  });
}
function initCountdown() {
  const el = $("#countdown"); if (!el) return;
  let target = localStorage.getItem("prisma_flash_deadline");
  if (!target || Number(target) <= Date.now()) { target = String(Date.now() + 72*60*60*1000); localStorage.setItem("prisma_flash_deadline", target); }
  const tick = () => {
    let diff = Math.max(0, Number(target) - Date.now());
    const units = [86400000,3600000,60000,1000];
    ["days","hours","minutes","seconds"].forEach((u,i) => { const n = Math.floor(diff/units[i]); diff %= units[i]; $(`[data-unit="${u}"]`, el).textContent = String(n).padStart(2,"0"); });
  };
  tick(); setInterval(tick,1000);
}
const testimonials = [
  ["“Nos guiaron desde la documentación hasta la reserva. Todo estuvo mucho más claro de lo que esperaba.”","María G. · Viaje internacional"],
  ["“La atención fue rápida y siempre supimos cuál era el siguiente paso.”","Carlos R. · Gestión de viaje"],
  ["“El acompañamiento hizo la diferencia. Volvería a trabajar con Prisma Agency.”","Daniela P. · Servicio personalizado"]
];
function initTestimonials() {
  const track=$("#testimonialTrack"), dots=$("#carouselDots"); if(!track||!dots)return;
  let index=0;
  const render=()=>{const t=testimonials[index];track.innerHTML=`<article class="testimonial"><blockquote>${t[0]}</blockquote><footer>${t[1]}</footer></article>`;dots.innerHTML=testimonials.map((_,i)=>`<button class="dot ${i===index?"is-active":""}" data-i="${i}" aria-label="Testimonio ${i+1}"></button>`).join("");$$(".dot",dots).forEach(b=>b.onclick=()=>{index=Number(b.dataset.i);render()})};
  $(".carousel-btn--prev")?.addEventListener("click",()=>{index=(index-1+testimonials.length)%testimonials.length;render()});
  $(".carousel-btn--next")?.addEventListener("click",()=>{index=(index+1)%testimonials.length;render()});
  render();
}
function initSocial() {
  const grid=$("#socialGrid"); if(!grid)return;
  const imgs=["https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=700&q=80","https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80","https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=700&q=80","https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=700&q=80"];
  grid.innerHTML=imgs.map((src,i)=>`<a class="social-tile" href="#" aria-label="Publicación ${i+1}"><img src="${src}" alt="Inspiración de viaje ${i+1}" loading="lazy"><span>#PrismaAgency</span></a>`).join("");
}
function showToast(text) { const t=$("#toast"); if(!t)return; t.textContent=text;t.classList.add("is-visible");setTimeout(()=>t.classList.remove("is-visible"),2500); }
window.addEventListener("keydown", e => { if(e.key==="Escape") $("#modalRoot").innerHTML=""; });

renderHeader(); renderFooter(); renderDestinations(); initFilters(); initQuoteForm(); initCountdown(); initTestimonials(); initSocial();
