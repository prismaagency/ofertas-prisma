import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

const WISHLIST_KEY = "prisma_wishlist";
const QUOTES_KEY = "prisma_quotes";
const WHATSAPP_NUMBER = "13144013488";
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
        <div class="nav-actions">
          <a class="btn btn--ghost" href="login.html" id="accountLink">Acceder</a>
        </div>
      </div>
    </header>`;

  $(".menu-toggle", host)?.addEventListener("click", () =>
    $(".nav-links", host)?.classList.toggle("is-open")
  );

  onAuthStateChanged(auth, user => {
    const link = $("#accountLink");
    if (!link) return;

    if (user) {
      const name =
        (user.displayName || "").trim() ||
        (user.email || "").split("@")[0] ||
        "Cliente";

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

function initWhatsAppFloat() {
  if (document.querySelector("[data-prisma-whatsapp]")) return;

  const style = document.createElement("style");
  style.textContent = `
    .prisma-whatsapp-float {
      position: fixed;
      right: 22px;
      bottom: 22px;
      width: 58px;
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #25D366;
      color: #fff;
      text-decoration: none;
      box-shadow: 0 8px 24px rgba(0,0,0,.28);
      z-index: 9999;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .prisma-whatsapp-float:hover {
      transform: translateY(-3px) scale(1.04);
      box-shadow: 0 12px 28px rgba(0,0,0,.34);
    }
    .prisma-whatsapp-float:focus-visible {
      outline: 3px solid #fff;
      outline-offset: 3px;
    }
    .prisma-whatsapp-float svg {
      width: 30px;
      height: 30px;
      fill: currentColor;
    }
    @media (max-width: 600px) {
      .prisma-whatsapp-float {
        width: 52px;
        height: 52px;
        right: 16px;
        bottom: 16px;
      }
      .prisma-whatsapp-float svg {
        width: 27px;
        height: 27px;
      }
    }
  `;
  document.head.appendChild(style);

  const link = document.createElement("a");
  link.className = "prisma-whatsapp-float";
  link.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("data-prisma-whatsapp", "");
  link.setAttribute("aria-label", "Contactar a Prisma Agency por WhatsApp");
  link.title = "Contactar por WhatsApp";
  link.innerHTML = `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M19.11 17.23c-.27-.14-1.59-.78-1.84-.87-.25-.09-.43-.14-.61.14-.18.27-.7.87-.86 1.05-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.58-1.5-1.85-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27s.98 2.63 1.11 2.81c.14.18 1.92 2.93 4.65 4.11.65.28 1.15.45 1.54.58.65.21 1.24.18 1.7.11.52-.08 1.59-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z"/>
      <path d="M16.03 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.59 4.39 1.63 6.24L3.12 28.8l6.7-1.71a12.75 12.75 0 0 0 6.21 1.61h.01c7.06 0 12.8-5.74 12.8-12.8S23.09 3.2 16.03 3.2zm0 23.4h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.98 1.02 1.06-3.88-.25-.4a10.59 10.59 0 1 1 8.97 4.97z"/>
    </svg>
  `;
  document.body.appendChild(link);
}


function initPrismaAssistant() {
  const root = $("#prismaAssistant");
  if (!root) return;

  try {
    const messages = $("#assistantMessages");
    const options = $("#assistantOptions");
    const progress = $("#assistantProgressBar");
    if (!messages || !options) return;

    const FIXED_ORIGIN = "La Habana, Cuba";
    const destinations = Array.isArray(window.PRISMA_DESTINATIONS)
      ? window.PRISMA_DESTINATIONS.filter(d => d && d.name)
      : [];

    const state = {
      step: 0,
      destination: null,
      service: "",
      date: "",
      travelers: ""
    };

    function addMessage(text, who = "bot") {
      const el = document.createElement("div");
      el.className = `assistant-msg ${who}`;
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
    }

    function setProgress() {
      const total = 4;
      progress.style.width = `${Math.min(100, Math.max(8, (state.step / total) * 100))}%`;
    }

    function renderOptions(items) {
      options.innerHTML = "";
      items.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "assistant-option";
        button.textContent = item.label || item;
        button.addEventListener("click", () => answer(item));
        options.appendChild(button);
      });
    }

    function askDestination() {
      state.step = 0;
      setProgress();
      addMessage("¿A qué país quieres viajar? Estas son las ofertas disponibles actualmente:");
      if (!destinations.length) {
        addMessage("No hay ofertas cargadas en este momento. Puedes continuar con el formulario de cotización.");
        return;
      }
      renderOptions(destinations.map(d => ({ label: d.name, value: d })));
    }

    function askService() {
      state.step = 1;
      setProgress();
      addMessage("¿Qué necesitas para tu viaje?");
      renderOptions([
        {label: "Visa / Visado", value: "Visa / Visado"},
        {label: "Vuelo", value: "Vuelo"},
        {label: "Hotel", value: "Hotel"},
        {label: "Paquete completo", value: "Paquete completo"}
      ]);
    }

    function askDate() {
      state.step = 2;
      setProgress();
      addMessage("¿Cuándo tienes pensado viajar?");
      renderOptions([
        {label: "Próximamente", value: "Próximamente"},
        {label: "En 1–3 meses", value: "En 1–3 meses"},
        {label: "En 4–6 meses", value: "En 4–6 meses"},
        {label: "Aún no lo sé", value: "Aún no lo sé"}
      ]);
    }

    function askTravelers() {
      state.step = 3;
      setProgress();
      addMessage("¿Cuántas personas viajarán?");
      renderOptions([
        {label: "1 persona", value: "1 persona"},
        {label: "2 personas", value: "2 personas"},
        {label: "3–4 personas", value: "3–4 personas"},
        {label: "5 o más", value: "5 o más"}
      ]);
    }

    function priceFor(destination) {
      return destination?.priceLabel || "Consultar precio";
    }

    function finish() {
      state.step = 4;
      setProgress();
      options.innerHTML = "";

      const d = state.destination;
      const summary = document.createElement("div");
      summary.className = "assistant-msg bot";
      summary.innerHTML = `
        <div class="assistant-result">
          <strong>Tu solicitud está lista</strong>
          <div class="assistant-result__row"><span>Origen</span><b>${escapeAssistant(FIXED_ORIGIN)}</b></div>
          <div class="assistant-result__row"><span>Destino</span><b>${escapeAssistant(d.name)}</b></div>
          <div class="assistant-result__row"><span>Oferta</span><b>${escapeAssistant(d.service || state.service)}</b></div>
          <div class="assistant-result__row"><span>Fecha</span><b>${escapeAssistant(state.date)}</b></div>
          <div class="assistant-result__row"><span>Viajeros</span><b>${escapeAssistant(state.travelers)}</b></div>
          <div class="assistant-result__row"><span>Precio de la oferta</span><b>${escapeAssistant(priceFor(d))}</b></div>
          <div class="assistant-actions">
            <button class="btn btn--primary" type="button" id="assistantUseForm">Pasar al formulario</button>
            <a class="btn btn--ghost" id="assistantWhatsApp" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>`;
      messages.appendChild(summary);
      messages.scrollTop = messages.scrollHeight;

      const text =
        `Hola Prisma Agency, quiero solicitar esta oferta.%0A%0A` +
        `📍 Origen: ${encodeURIComponent(FIXED_ORIGIN)}%0A` +
        `✈️ Destino: ${encodeURIComponent(d.name)}%0A` +
        `🧳 Oferta: ${encodeURIComponent(d.service || state.service)}%0A` +
        `📅 Fecha: ${encodeURIComponent(state.date)}%0A` +
        `👥 Viajeros: ${encodeURIComponent(state.travelers)}%0A` +
        `💰 Precio de la oferta: ${encodeURIComponent(priceFor(d))}`;

      $("#assistantWhatsApp").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
      $("#assistantUseForm")?.addEventListener("click", () => fillQuoteForm(d));
    }

    function fillQuoteForm(d) {
      const form = $("#quoteForm");
      if (!form) return;

      const destination = form.elements.destination || $("#quoteDestination");
      const travelers = form.elements.travelers;
      const service = form.elements.service;
      const details = form.elements.details;

      if (destination) {
        const exact = [...destination.options].find(o =>
          o.value.toLowerCase() === d.name.toLowerCase()
        );
        if (exact) destination.value = exact.value;
      }

      if (travelers) {
        const number = state.travelers.match(/\d+/);
        if (number) travelers.value = state.travelers.includes("5 o más") ? 5 : Number(number[0]);
      }

      if (service) {
        const wanted = state.service.toLowerCase();
        const exact = [...service.options].find(o => o.value.toLowerCase() === wanted);
        if (exact) service.value = exact.value;
      }

      if (details) {
        details.value =
          `Origen: ${FIXED_ORIGIN}\n` +
          `Oferta seleccionada: ${d.name} — ${priceFor(d)}\n` +
          `Servicio: ${d.service || state.service}\n` +
          `Fecha: ${state.date}\n` +
          `Viajeros: ${state.travelers}`;
      }

      $("#cotizacion")?.scrollIntoView({behavior:"smooth", block:"start"});
    }

    function escapeAssistant(value) {
      return String(value || "").replace(/[&<>"']/g, c => ({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
      }[c]));
    }

    function answer(item) {
      options.innerHTML = "";
      if (state.step === 0) {
        state.destination = item.value;
        addMessage(item.label, "user");
        addMessage(`Has seleccionado ${item.label}.`);
        setTimeout(askService, 180);
      } else if (state.step === 1) {
        state.service = item.value;
        addMessage(item.label, "user");
        setTimeout(askDate, 180);
      } else if (state.step === 2) {
        state.date = item.value;
        addMessage(item.label, "user");
        setTimeout(askTravelers, 180);
      } else if (state.step === 3) {
        state.travelers = item.value;
        addMessage(item.label, "user");
        setTimeout(finish, 180);
      }
    }

    askDestination();
  } catch (error) {
    // El asistente nunca debe impedir que el resto de app.js siga funcionando.
    console.error("Asistente Prisma:", error);
  }
}

function showToast(text) {
  const t=$("#toast"); if(!t)return;
  t.textContent=text;
  t.classList.add("is-visible");
  setTimeout(()=>t.classList.remove("is-visible"),2500);
}

window.addEventListener("keydown", e => {
  if(e.key==="Escape") $("#modalRoot").innerHTML="";
});

renderHeader();
renderFooter();
renderDestinations();
initFilters();
initQuoteForm();
initCountdown();
initTestimonials();
initSocial();
initPrismaAssistant();
initWhatsAppFloat();
