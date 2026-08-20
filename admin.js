import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import "./destinations.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ADMIN_EMAIL = "prismaagency401@gmail.com";
const $ = s => document.querySelector(s);

const msg = (el, text, error = false) => {
  if (!el) return;
  el.textContent = text;
  el.style.color = error ? "var(--danger)" : "var(--success)";
};

const clearFlashForm = () => {
  $("#offerId").value = "";
  $("#destination").value = "";
  $("#price").value = "";
  $("#endsAt").value = "";
  $("#active").value = "true";
  $("#msg").textContent = "";
};

const clearDestinationForm = () => {
  $("#destinationId").value = "";
  $("#destinationName").value = "";
  $("#destinationPrice").value = "";
  $("#destinationService").value = "";
  $("#destinationTime").value = "";
  $("#destinationActive").value = "true";
  $("#destinationMsg").textContent = "";
};

function localInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

async function loadOffers() {
  const box = $("#offerList");
  if (!box) return;
  box.innerHTML = "Cargando...";
  try {
    const snap = await getDocs(collection(db, "flashOffers"));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    box.innerHTML = items.length ? items.map(o => `
      <div class="admin-row">
        <div>
          <strong>${escapeHtml(o.destination || "")}</strong><br>
          <small>${escapeHtml(o.price || "")} · ${o.active === false ? "Inactiva" : "Activa"}${o.endsAt ? " · termina " + new Date(o.endsAt).toLocaleString("es-US") : ""}</small>
        </div>
        <div class="admin-actions">
          <button class="btn btn--ghost" data-edit="${o.id}">Editar</button>
          <button class="btn btn--danger" data-del="${o.id}">Eliminar</button>
        </div>
      </div>`).join("") : "No hay ofertas todavía.";

    box.querySelectorAll("[data-edit]").forEach(button => {
      button.onclick = () => {
        const o = items.find(x => x.id === button.dataset.edit);
        if (!o) return;
        $("#offerId").value = o.id;
        $("#destination").value = o.destination || "";
        $("#price").value = o.price || "";
        $("#active").value = o.active === false ? "false" : "true";
        $("#endsAt").value = localInput(o.endsAt);
        document.querySelector("#offerForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });

    box.querySelectorAll("[data-del]").forEach(button => {
      button.onclick = async () => {
        if (!confirm("¿Eliminar esta oferta Flash?")) return;
        try {
          await deleteDoc(doc(db, "flashOffers", button.dataset.del));
          loadOffers();
        } catch (e) {
          msg($("#msg"), "No se pudo eliminar la oferta.", true);
        }
      };
    });
  } catch (e) {
    console.error(e);
    box.innerHTML = "No se pudo leer Firestore. Revisa la base de datos y las reglas.";
  }
}

async function loadDeadline() {
  try {
    const snap = await getDoc(doc(db, "flashSettings", "main"));
    if (snap.exists() && snap.data().deadline) {
      $("#deadline").value = localInput(snap.data().deadline);
    }
  } catch (e) {
    console.error(e);
  }
}

function baseDestinations() {
  return Array.isArray(window.PRISMA_DESTINATIONS) ? window.PRISMA_DESTINATIONS : [];
}

async function loadDestinations() {
  const box = $("#destinationList");
  if (!box) return;
  box.innerHTML = "Cargando...";
  try {
    const snap = await getDocs(collection(db, "destinations"));
    const remote = new Map(snap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));
    const items = baseDestinations().map(base => {
      const saved = remote.get(base.id);
      return saved ? { ...base, ...saved } : base;
    });

    box.innerHTML = items.map(o => `
      <div class="admin-row">
        <div>
          <strong>${escapeHtml(o.name)}</strong><br>
          <small>${escapeHtml(o.priceLabel || "Consultar")} · ${o.active === false || o.deleted === true ? "Inactivo" : "Activo"}</small>
        </div>
        <div class="admin-actions">
          <button class="btn btn--ghost" data-dest-edit="${o.id}">Editar</button>
          <button class="btn btn--danger" data-dest-del="${o.id}">Eliminar</button>
        </div>
      </div>`).join("");

    box.querySelectorAll("[data-dest-edit]").forEach(button => {
      button.onclick = () => {
        const o = items.find(x => x.id === button.dataset.destEdit);
        if (!o) return;
        $("#destinationId").value = o.id;
        $("#destinationName").value = o.name || "";
        $("#destinationPrice").value = o.priceLabel || (o.price != null ? `USD ${Number(o.price).toLocaleString("en-US")}` : "");
        $("#destinationService").value = o.service || "";
        $("#destinationTime").value = o.time || "";
        $("#destinationActive").value = (o.active === false || o.deleted === true) ? "false" : "true";
        document.querySelector("#destinationForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });

    box.querySelectorAll("[data-dest-del]").forEach(button => {
      button.onclick = async () => {
        const o = items.find(x => x.id === button.dataset.destDel);
        if (!o) return;
        if (!confirm(`¿Eliminar ${o.name} de la página?`)) return;
        try {
          await setDoc(doc(db, "destinations", o.id), {
            name: o.name,
            price: o.price ?? null,
            priceLabel: o.priceLabel ?? "Consultar",
            service: o.service ?? "",
            time: o.time ?? "",
            active: false,
            deleted: true,
            updatedAt: serverTimestamp()
          }, { merge: true });
          msg($("#destinationMsg"), "Destino eliminado de la página.");
          loadDestinations();
        } catch (e) {
          console.error(e);
          msg($("#destinationMsg"), "No se pudo eliminar el destino.", true);
        }
      };
    });
  } catch (e) {
    console.error(e);
    box.innerHTML = "No se pudo leer los destinos de Firestore. Revisa las reglas.";
  }
}

$("#offerForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const data = {
    destination: $("#destination").value.trim(),
    price: $("#price").value.trim(),
    active: $("#active").value === "true",
    endsAt: $("#endsAt").value ? new Date($("#endsAt").value).toISOString() : null,
    updatedAt: serverTimestamp()
  };
  try {
    const id = $("#offerId").value;
    if (id) await updateDoc(doc(db, "flashOffers", id), data);
    else await addDoc(collection(db, "flashOffers"), { ...data, createdAt: serverTimestamp() });
    msg($("#msg"), "Oferta guardada.");
    clearFlashForm();
    loadOffers();
  } catch (e) {
    console.error(e);
    msg($("#msg"), "No se pudo guardar. Revisa Firestore y sus reglas.", true);
  }
});

$("#clearBtn")?.addEventListener("click", clearFlashForm);

$("#saveDeadline")?.addEventListener("click", async () => {
  try {
    const v = $("#deadline").value;
    if (!v) throw new Error("missing deadline");
    await setDoc(doc(db, "flashSettings", "main"), {
      deadline: new Date(v).toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    msg($("#deadlineMsg"), "Contador guardado.");
  } catch (e) {
    console.error(e);
    msg($("#deadlineMsg"), "No se pudo guardar el contador.", true);
  }
});

$("#destinationForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const id = $("#destinationId").value;
  if (!id) {
    msg($("#destinationMsg"), "Selecciona un destino de la lista para editarlo.", true);
    return;
  }

  const base = baseDestinations().find(x => x.id === id) || {};
  const label = $("#destinationPrice").value.trim() || "Consultar";
  const numeric = Number(label.replace(/[^\d.]/g, ""));
  const data = {
    name: $("#destinationName").value.trim() || base.name || id,
    price: Number.isFinite(numeric) && numeric > 0 ? numeric : (base.price ?? null),
    priceLabel: label,
    service: $("#destinationService").value.trim(),
    time: $("#destinationTime").value.trim(),
    active: $("#destinationActive").value === "true",
    deleted: false,
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "destinations", id), data, { merge: true });
    msg($("#destinationMsg"), "Destino guardado.");
    clearDestinationForm();
    loadDestinations();
  } catch (e) {
    console.error(e);
    msg($("#destinationMsg"), "No se pudo guardar el destino. Revisa Firestore y sus reglas.", true);
  }
});

$("#clearDestinationBtn")?.addEventListener("click", clearDestinationForm);
$("#logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "login.html";
});

onAuthStateChanged(auth, user => {
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    document.body.innerHTML = '<main class="admin-denied card-surface"><h2>Acceso denegado</h2><p>Entra con la cuenta administradora configurada.</p><a class="btn btn--primary" href="login.html">Ir al acceso</a></main>';
    return;
  }
  $("#adminUser").textContent = "Administrador: " + user.email;
  loadOffers();
  loadDeadline();
  loadDestinations();
});
