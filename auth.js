import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJp0kxqNLONHFNyUEsg1nO9LjgJaVG0GY",
  authDomain: "prisma-agency-86c98.firebaseapp.com",
  projectId: "prisma-agency-86c98",
  storageBucket: "prisma-agency-86c98.firebasestorage.app",
  messagingSenderId: "938361295336",
  appId: "1:938361295336:web:91eaedf36823f5d8de945d",
  measurementId: "G-J5LEGVED72"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

const $ = s => document.querySelector(s);
const form=$("#authForm"), message=$("#authMessage"), toggle=$("#toggleMode"), submit=$("#authSubmit"), title=$("#authTitle"), subtitle=$("#authSubtitle"), nameField=$("#nameField");
let registerMode=false;

function setMessage(text,error=false){message.textContent=text;message.className=`form-message ${error?"error":"success"}`;}
function renderHeader(){
  const host=$("#siteHeader"); if(!host)return;
  host.innerHTML=`<header class="site-header"><div class="container nav"><a class="brand" href="index.html">Prisma <span>Agency</span></a><button class="menu-toggle" type="button">☰</button><nav><ul class="nav-links"><li><a href="index.html#destinos">Destinos</a></li><li><a href="index.html#nosotros">Nosotros</a></li><li><a href="index.html#cotizacion">Cotización</a></li></ul></nav><div class="nav-actions"><a class="btn btn--ghost" href="index.html">Inicio</a></div></div></header>`;
}
function renderFooter(){const h=$("#siteFooter");if(h)h.innerHTML=`<footer class="site-footer"><div class="container footer-inner"><span>© ${new Date().getFullYear()} Prisma Agency</span><span>Área segura del cliente</span></div></footer>`;}
function setMode(){
  registerMode=!registerMode;
  title.textContent=registerMode?"Crear cuenta":"Iniciar sesión";
  subtitle.textContent=registerMode?"Regístrate para guardar ofertas y seguir tus cotizaciones.":"Accede para consultar tus cotizaciones y ofertas guardadas.";
  nameField.classList.toggle("hidden",!registerMode);
  $("#authPassword").autocomplete=registerMode?"new-password":"current-password";
  submit.textContent=registerMode?"Crear cuenta":"Entrar";
  $("#switchText").textContent=registerMode?"¿Ya tienes cuenta?":"¿No tienes cuenta?";
  toggle.textContent=registerMode?"Iniciar sesión":"Crear cuenta";
  setMessage("");
}
toggle?.addEventListener("click",setMode);
form?.addEventListener("submit",async e=>{
  e.preventDefault(); setMessage("");
  const email=$("#authEmail").value.trim(), password=$("#authPassword").value, name=$("#authName").value.trim();
  if(!form.checkValidity()){form.reportValidity();return;}
  try{
    if(registerMode){
      const credential=await createUserWithEmailAndPassword(auth,email,password);
      if(name) await updateProfile(credential.user,{displayName:name});
    }else await signInWithEmailAndPassword(auth,email,password);
    location.href="perfil.html";
  }catch(err){setMessage(humanizeAuthError(err.code, err.message),true);}
});
$("#googleLogin")?.addEventListener("click", async () => {
  const button = $("#googleLogin");
  if (button) {
    button.disabled = true;
    button.textContent = "Conectando con Google...";
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
    window.location.assign("perfil.html");
  } catch (err) {
    console.error("Firebase Google Sign-In:", err);
    setMessage(humanizeAuthError(err.code, err.message), true);
    if (button) {
      button.disabled = false;
      button.textContent = "Continuar con Google";
    }
  }
});
$("#logoutBtn")?.addEventListener("click",()=>signOut(auth));
function humanizeAuthError(code, message = "") {
  const map = {
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/popup-closed-by-user": "La ventana de Google fue cerrada.",
    "auth/popup-blocked": "El navegador bloqueó la ventana de Google.",
    "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase Authentication. Añádelo en Authentication → Settings → Authorized domains.",
    "auth/operation-not-allowed": "El acceso con Google no está habilitado. Activa Google en Authentication → Sign-in method.",
    "auth/account-exists-with-different-credential": "Ya existe una cuenta con este correo usando otro método de acceso.",
    "auth/network-request-failed": "No se pudo conectar con Firebase. Comprueba tu conexión.",
    "auth/api-key-not-valid": "La API key de Firebase no es válida para esta Web App. Verifica la configuración de Firebase."
  };
  return map[code] || `Error de Firebase: ${code || "desconocido"}${message ? ` — ${message}` : ""}`;
}
onAuthStateChanged(auth,user=>{ if(user && location.pathname.endsWith("login.html")) location.href="perfil.html"; });
renderHeader();renderFooter();