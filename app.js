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

  const messages = $("#assistantMessages");
  const options = $("#assistantOptions");
  const inputForm = $("#assistantInputForm");
  const input = $("#assistantTextInput");
  const progress = $("#assistantProgressBar");

  const state = {
    step: 0,
    destination: "",
    service: "",
    date: "",
    travelers: "",
    origin: "",
    budget: "",
    details: ""
  };

  const steps = [
    {
      key: "destination",
      question: "¿A dónde quieres viajar?",
      options: ["Estados Unidos", "Europa", "Caribe", "México", "Canadá", "Otro destino"]
    },
    {
      key: "service",
      question: "Perfecto. ¿Qué necesitas gestionar?",
      options: ["Visado", "Vuelo", "Vuelo + hotel", "Paquete completo", "Asesoría de viaje"]
    },
    {
      key: "date",
      question: "¿Cuándo tienes pensado viajar? Puedes escribir una fecha, mes o algo como «diciembre de 2026».",
      options: ["Próximamente", "En 1–3 meses", "En 4–6 meses", "Aún no lo sé"]
    },
    {
      key: "travelers",
      question: "¿Cuántas personas viajarán?",
      options: ["1 persona", "2 personas", "3–4 personas", "5 o más"]
    },
    {
      key: "origin",
      question: "¿Desde qué ciudad o país viajarías?",
      options: []
    },
    {
      key: "budget",
      question: "¿Cuál es tu presupuesto aproximado en USD?",
      options: ["Menos de $1,000", "$1,000–$2,500", "$2,500–$5,000", "Más de $5,000", "Aún no lo sé"]
    }
  ];

  function addMessage(text, who="bot", html=false) {
    const el = document.createElement("div");
    el.className = `assistant-msg ${who}`;
    if (html) el.innerHTML = text; else el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function setProgress() {
    progress.style.width = `${Math.min(100, Math.max(8, (state.step / steps.length) * 100))}%`;
  }

  function renderOptions(list) {
    options.innerHTML = "";
    list.forEach(value => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "assistant-option";
      button.textContent = value;
      button.addEventListener("click", () => answer(value));
      options.appendChild(button);
    });
  }

  function askCurrentStep() {
    const current = steps[state.step];
    if (!current) return finish();
    addMessage(current.question);
    renderOptions(current.options);
    setProgress();
    input.placeholder = current.key === "origin"
      ? "Ej. St. Louis, Missouri"
      : current.key === "date"
        ? "Ej. diciembre de 2026"
        : "Escribe tu respuesta...";
    input.focus();
  }

  function answer(value) {
    const clean = String(value || "").trim();
    if (!clean) return;
    addMessage(clean, "user");
    options.innerHTML = "";

    const key = steps[state.step]?.key;
    if (key) state[key] = clean;
    state.step += 1;

    if (state.step < steps.length) {
      window.setTimeout(askCurrentStep, 220);
    } else {
      window.setTimeout(finish, 250);
    }
  }

  function buildSummary() {
    return `
      <div class="assistant-result">
        <strong>Tu solicitud está lista</strong>
        <div class="assistant-result__row"><span>Destino</span><b>${escapeAssistant(state.destination)}</b></div>
        <div class="assistant-result__row"><span>Servicio</span><b>${escapeAssistant(state.service)}</b></div>
        <div class="assistant-result__row"><span>Fecha</span><b>${escapeAssistant(state.date)}</b></div>
        <div class="assistant-result__row"><span>Viajeros</span><b>${escapeAssistant(state.travelers)}</b></div>
        <div class="assistant-result__row"><span>Origen</span><b>${escapeAssistant(state.origin)}</b></div>
        <div class="assistant-result__row"><span>Presupuesto</span><b>${escapeAssistant(state.budget)}</b></div>
        <div class="assistant-actions">
          <button class="btn btn--primary" type="button" id="assistantUseForm">Pasar al formulario</button>
          <a class="btn btn--ghost" id="assistantWhatsApp" target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a>
        </div>
      </div>`;
  }

  function finish() {
    state.step = steps.length;
    setProgress();
    addMessage("Gracias. Ya tengo la información básica. Aquí tienes un resumen de tu solicitud:", "bot");
    const summary = document.createElement("div");
    summary.innerHTML = buildSummary();
    messages.appendChild(summary.firstElementChild);
    messages.scrollTop = messages.scrollHeight;

    const waText =
      `Hola Prisma Agency, quiero solicitar una cotización.%0A%0A` +
      `📍 Destino: ${encodeURIComponent(state.destination)}%0A` +
      `🧳 Servicio: ${encodeURIComponent(state.service)}%0A` +
      `📅 Fecha: ${encodeURIComponent(state.date)}%0A` +
      `👥 Viajeros: ${encodeURIComponent(state.travelers)}%0A` +
      `📌 Origen: ${encodeURIComponent(state.origin)}%0A` +
      `💰 Presupuesto: ${encodeURIComponent(state.budget)}`;

    const wa = $("#assistantWhatsApp");
    if (wa) wa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

    $("#assistantUseForm")?.addEventListener("click", () => fillQuoteForm());
  }

  function fillQuoteForm() {
    const form = $("#quoteForm");
    if (!form) return;

    const name = form.elements.name;
    const email = form.elements.email;
    const phone = form.elements.phone;
    const destination = form.elements.destination;
    const travelers = form.elements.travelers;
    const budget = form.elements.budget;
    const service = form.elements.service;
    const details = form.elements.details;

    if (destination) {
      const option = [...destination.options].find(o =>
        o.value.toLowerCase() === state.destination.toLowerCase()
      );
      if (option) destination.value = option.value;
      else if (state.destination) {
        const custom = document.createElement("option");
        custom.value = state.destination;
        custom.textContent = state.destination;
        destination.appendChild(custom);
        destination.value = state.destination;
      }
    }

    if (travelers) {
      const match = state.travelers.match(/\d+/);
      if (match) travelers.value = state.travelers.includes("5 o más") ? 5 : Number(match[0]);
    }

    if (budget) {
      const numeric = state.budget.match(/[\d,]+/);
      if (numeric) budget.value = numeric[0].replace(/,/g, "");
    }

    if (service) {
      const option = [...service.options].find(o =>
        o.value.toLowerCase() === state.service.toLowerCase()
      );
      if (option) service.value = option.value;
    }

    if (details) {
      details.value =
        `Origen: ${state.origin}\n` +
        `Fecha indicada: ${state.date}\n` +
        `Presupuesto indicado: ${state.budget}\n` +
        `Información recopilada por el Asistente Prisma.`;
    }

    document.querySelector("#cotizacion")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      if (!name?.value) name?.focus();
      else if (!email?.value) email?.focus();
      else if (!phone?.value) phone?.focus();
    }, 500);
  }

  function escapeAssistant(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
  }

  inputForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (state.step >= steps.length) return;
    answer(input.value);
    input.value = "";
  });

  addMessage("Hola 👋 Soy el Asistente Prisma. Te haré unas preguntas rápidas para preparar tu cotización.");
  window.setTimeout(askCurrentStep, 250);
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
