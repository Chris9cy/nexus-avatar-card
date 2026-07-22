class NexusAvatarCard extends HTMLElement {
  static getStubConfig(hass) {
    const person = hass && hass.states
      ? Object.keys(hass.states).find(id => id.startsWith("person."))
      : null;
    return { entity: person || "person.example" };
  }
  setConfig(config) {
    if (!config.entity) throw new Error("entity is required");
    this._c = config;
  }
  getCardSize() { return 3; }
  set hass(h) {
    this._h = h;
    if (!this._built) this._build();
    this._update();
  }
  _build() {
    this._built = true;
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
<style>
:host { display:block; height:100%; }
ha-card { height:100%; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; }
#col { display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 6px; }
#stage { perspective:600px; position:relative; }
#ring { width:112px; height:112px; border-radius:50%; padding:5px; box-sizing:border-box;
  background: conic-gradient(var(--rc,#34d399) calc(var(--batt,100)*1%), rgba(255,255,255,.13) 0);
  transition: background .6s; }
#orb { width:100%; height:100%; border-radius:50%; overflow:hidden;
  animation: nx-sway 9s ease-in-out infinite; }
:host([data-home]) #orb { animation: nx-sway 9s ease-in-out infinite, nx-breathe 3.6s ease-in-out infinite; }
img { width:100%; height:100%; object-fit:cover; display:block; transition: filter .8s; }
:host(:not([data-home])) img { filter: grayscale(.5) brightness(.85); }
#nm { font-weight:700; font-size:14px; }
#cap { font-size:12px; opacity:.7; letter-spacing:.4px; transition: color .6s; text-align:center; }
:host([data-home]) #cap { color:#34d399; opacity:.95; }
:host([data-link]) #cap { text-decoration: underline dotted rgba(255,255,255,.35); text-underline-offset: 3px; cursor: pointer; }
#cap2 { font-size:11px; opacity:.5; letter-spacing:.4px; text-align:center; }
#cap2:empty { display:none; }
#badge { position:absolute; right:-3px; bottom:-3px; width:36px; height:36px; border-radius:50%;
  display:none; align-items:center; justify-content:center; font-size:18px; z-index:2;
  background:rgba(24,18,4,.94); border:2px solid #fbbf24;
  box-shadow:0 0 14px rgba(251,191,36,.85);
  animation: nx-drive-bob 1.5s ease-in-out infinite; }
:host([data-driving]) #badge { display:flex; }
:host([data-driving]) img { filter:none; }
:host([data-driving]) #orb { animation: nx-sway 9s ease-in-out infinite, nx-drive-glow 2.2s ease-in-out infinite; }
:host([data-driving]) #cap { color:#fbbf24; opacity:1; font-weight:700; letter-spacing:.6px; }
:host([data-driving]) #cap2 { color:#fcd34d; opacity:.85; }
@keyframes nx-sway { 0%,100% { transform: rotateY(-8deg) } 50% { transform: rotateY(8deg) } }
@keyframes nx-breathe { 0%,100% { box-shadow: 0 0 6px rgba(52,211,153,.25) } 50% { box-shadow: 0 0 24px rgba(52,211,153,.8) } }
@keyframes nx-drive-glow { 0%,100% { box-shadow: 0 0 8px rgba(251,191,36,.3) } 50% { box-shadow: 0 0 26px rgba(251,191,36,.85) } }
@keyframes nx-drive-bob { 0%,100% { transform: translateX(0) } 50% { transform: translateX(4px) } }
</style>
<ha-card><div id="col">
  <div id="stage"><div id="ring"><div id="orb"><img id="img"></div></div><div id="badge">&#128663;</div></div>
  <div id="nm"></div><div id="cap"></div><div id="cap2"></div>
</div></ha-card>`;
    this.shadowRoot.querySelector("ha-card").addEventListener("click", () => {
      const ev = new Event("hass-more-info", { bubbles: true, composed: true });
      ev.detail = { entityId: this._c.entity };
      this.dispatchEvent(ev);
    });
    this.shadowRoot.getElementById("cap").addEventListener("click", (e) => {
      if (!this.hasAttribute("data-link") || !this._mapLink) return;
      e.stopPropagation();
      if (this._mapLink.startsWith("/")) {
        history.pushState(null, "", this._mapLink);
        const ev = new Event("location-changed", { bubbles: true, composed: true });
        window.dispatchEvent(ev);
      } else {
        const a = document.createElement("a");
        a.href = this._mapLink;
        a.target = "_blank";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    });
    this._img = this.shadowRoot.getElementById("img");
    this._img.addEventListener("error", () => {
      const home = (this._c.images || {}).home;
      if (home && this._img.getAttribute("src") !== home) this._img.src = home;
    });
  }
  _st(id) { return (this._h.states || {})[id]; }
  _dwell(iso) {
    const t = Date.parse(iso);
    if (isNaN(t)) return "";
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return "there " + m + "m";
    const h = Math.floor(m / 60);
    if (h < 24) return "there " + h + "h " + (m % 60) + "m";
    return "there " + Math.floor(h / 24) + "d";
  }
  _update() {
    const c = this._c;
    const p = this._st(c.entity);
    if (!p) return;
    const st = p.state;
    const home = st === "home";
    const imgs = c.images || {};
    const tr = c.tracker ? this._st(c.tracker) : null;
    const spd = tr && tr.attributes && typeof tr.attributes.speed === "number" ? tr.attributes.speed : 0;
    const lf = c.life360 ? this._st(c.life360) : null;
    const lfA = lf && lf.attributes ? lf.attributes : {};
    const lfDriving = lfA.driving === true;
    const lfSpeed = typeof lfA.speed === "number" ? lfA.speed : 0;
    const loc = c.location ? this._st(c.location) : null;
    const locA = loc && loc.attributes ? loc.attributes : {};
    this._mapLink = c.link || locA.map_link || "";
    let locName = "";
    if (loc && loc.state && !["unknown", "unavailable"].includes(loc.state)) {
      locName = loc.state.split(",").map(s => s.trim())
        .filter(s => s && s.toLowerCase() !== "not_home" && s.toLowerCase() !== "away" && s.toLowerCase() !== "home")
        .join(", ");
    }
    const tv = c.travel ? this._st(c.travel) : null;
    const mins = tv && !isNaN(parseFloat(tv.state)) ? Math.round(parseFloat(tv.state)) : 0;
    const km = tv && tv.attributes && typeof tv.attributes.distance === "number" ? Math.round(tv.attributes.distance) : 0;
    const dot = String.fromCharCode(183);
    const hour = new Date().getHours();
    const night = hour >= 23 || hour < 7;
    /* a tracker already in the home zone beats everything — the person
       entity can lag minutes behind (iOS stops updating once stationary,
       leaving a stale speed that would otherwise read as "driving") */
    const lfHome = lf && lf.state === "home";
    const trHome = tr && tr.state === "home";
    const arriving = !home && (lfHome || trHome);
    /* speed only counts while the reading is fresh (<10 min) and life360
       isn't explicitly saying the drive is over */
    const spdFresh = tr && tr.last_updated &&
      (Date.now() - Date.parse(tr.last_updated)) < 600000;
    const lfSaysStopped = lf && lfA.driving === false &&
      (!tr || Date.parse(lf.last_updated) >= Date.parse(tr.last_updated));
    const driving = !home && !arriving &&
      (lfDriving || (spd > 2 && spdFresh && !lfSaysStopped));
    let src = imgs.home || (p.attributes || {}).entity_picture || "";
    let cap = "Home";
    let cap2 = "";
    if (arriving) {
      src = imgs.home || src;
      cap = "Arriving home";
    }
    else if (driving) {
      src = imgs.driving || imgs.away || src;
      const kmh = lfDriving && lfSpeed > 0 ? Math.round(lfSpeed) : Math.round(spd * 3.6);
      cap = kmh > 0 ? "Driving " + dot + " " + kmh + " km/h" : "Driving";
    }
    else if (!home) {
      src = imgs.away || src;
      cap = locName || (st === "not_home" ? "Away" : st);
      const dw = lfA.at_loc_since ? this._dwell(lfA.at_loc_since) : "";
      if (dw) cap += " " + dot + " " + dw;
    }
    else if (night) { src = imgs.night || src; cap = "Sleeping"; }
    if (!home && mins > 0) {
      cap2 = (km > 0 ? km + " km " + dot + " " : "") + mins + " min home";
      if (driving) cap2 += " " + String.fromCharCode(8594) + " " +
        new Date(Date.now() + mins * 60000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    if (home || arriving) this.setAttribute("data-home", ""); else this.removeAttribute("data-home");
    if (driving) this.setAttribute("data-driving", ""); else this.removeAttribute("data-driving");
    if (!home && this._mapLink) this.setAttribute("data-link", ""); else this.removeAttribute("data-link");
    if (this._img.getAttribute("src") !== src) this._img.src = src;
    this.shadowRoot.getElementById("nm").textContent = c.name || (p.attributes || {}).friendly_name || "";
    this.shadowRoot.getElementById("cap").textContent = cap;
    this.shadowRoot.getElementById("cap2").textContent = cap2;
    let batt = NaN;
    if (c.battery) { const b = this._st(c.battery); if (b) batt = parseFloat(b.state); }
    const ring = this.shadowRoot.getElementById("ring");
    if (!isNaN(batt)) {
      ring.style.setProperty("--batt", String(Math.max(0, Math.min(100, batt))));
      ring.style.setProperty("--rc", batt < 20 ? "#ef4444" : batt < 40 ? "#f59e0b" : "#34d399");
    } else {
      ring.style.setProperty("--batt", "100");
      ring.style.setProperty("--rc", "rgba(255,255,255,.15)");
    }
  }
}
customElements.define("nexus-avatar-card", NexusAvatarCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "nexus-avatar-card", name: "Nexus Avatar Card", description: "Living presence avatar: state artwork, battery ring, breathing glow, 3D sway, Life360 driving, places, dwell, Waze ETA, tap-to-locate" });
