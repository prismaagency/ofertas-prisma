import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "REEMPLAZAR_API_KEY",
  authDomain: "REEMPLAZAR.firebaseapp.com",
  projectId: "REEMPLAZAR_PROJECT_ID",
  storageBucket: "REEMPLAZAR.firebasestorage.app",
  messagingSenderId: "REEMPLAZAR_MESSAGING_SENDER_ID",
  appId: "REEMPLAZAR_APP_ID"
};
const app=initializeApp(firebaseConfig),auth=getAuth(app);
const WISHLIST_KEY="prisma_wishlist",QUOTES_KEY="prisma_quotes";
const $=s=>document.querySelector(s);

function header(){
  $("#siteHeader").innerHTML=`<header class="site-header"><div class="container nav"><a class="brand" href="index.html">Prisma <span>Agency</span></a><nav><ul class="nav-links"><li><a href="index.html#destinos">Destinos</a></li><li><a href="index.html#cotizacion">Cotización</a></li></ul></nav><div class="nav-actions"><button class="btn btn--ghost" id="logoutBtn" type="button">Cerrar sesión</button></div></div></header>`;
  $("#logoutBtn").onclick=async()=>{await signOut(auth);location.href="login.html";};
}
function footer(){ $("#siteFooter").innerHTML=`<footer class="site-footer"><div class="container footer-inner"><span>© ${new Date().getFullYear()} Prisma Agency</span><span>Prisma Agency · Área del cliente</span></div></footer>`; }
function wishlist(){
  let ids=[];try{ids=JSON.parse(localStorage.getItem(WISHLIST_KEY)||"[]")}catch{}
  const items=window.PRISMA_DESTINATIONS.filter(d=>ids.includes(d.id)),grid=$("#wishlistGrid");
  grid.innerHTML=items.length?items.map(d=>`<article class="wishlist-card"><img src="${d.flag}" alt="${d.name}"><div class="wishlist-card__body"><h3>${d.name}</h3><p>${d.priceLabel}</p><button class="btn btn--danger" data-remove="${d.id}" type="button">Quitar</button></div></article>`).join(""):`<p style="color:var(--muted)">Todavía no has guardado ofertas. <a href="index.html#destinos" style="color:var(--gold)">Explorar destinos</a>.</p>`;
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{ids=ids.filter(id=>id!==b.dataset.remove);localStorage.setItem(WISHLIST_KEY,JSON.stringify(ids));wishlist();});
}
function quotes(){
  let items=[];try{items=JSON.parse(localStorage.getItem(QUOTES_KEY)||"[]")}catch{}
  const box=$("#quoteList");
  box.innerHTML=items.length?items.map(q=>`<article class="quote-item"><div class="quote-item__top"><strong>${q.destination}</strong><span class="status status--${q.status==="Aprobada"?"approved":q.status==="En revisión"?"review":"pending"}">${q.status}</span></div><small>Solicitud: ${new Date(q.createdAt).toLocaleDateString("es-US")} · ${q.startDate} → ${q.endDate}</small><p style="margin-top:8px;color:var(--muted)">${q.service} · ${q.travelers} viajero(s)</p></article>`).join(""):`<p style="color:var(--muted)">No tienes cotizaciones locales todavía.</p>`;
}
onAuthStateChanged(auth,user=>{
  if(!user){location.href="login.html";return;}
  $("#profileWelcome").textContent=`Sesión iniciada como ${user.displayName||user.email}.`;
  wishlist();quotes();
});
header();footer();
