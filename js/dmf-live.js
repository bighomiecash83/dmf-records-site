// Live roster + releases from the DMF app backend (public.site_roster() / public.site_releases()).
// The static HTML on each page stays as the fallback (and is what search engines index);
// this only fills in fresher numbers and the latest releases when the backend answers.
import { supabase } from "./dmf-config.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Artists with their own page on this site.
const known = new Set(["big-homie-cash", "freezzo", "obmb-delo", "ellumf", "go-savage", ...[...document.querySelectorAll('a.card[href$=".html"]')].map((a) => a.getAttribute("href").replace(/\.html$/, ""))]);
const nice = (d) => { const t = new Date(`${d}T12:00:00Z`); return Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== d ? String(d ?? "") : t.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }); };

async function roster(sb) {
  const cards = document.querySelectorAll('a.card[href$=".html"]');
  if (!cards.length) return;
  const { data, error } = await sb.rpc("site_roster");
  if (error || !Array.isArray(data) || !data.length) return;
  const bySlug = new Map(data.map((r) => [r.slug, r]));
  cards.forEach((card) => {
    const r = bySlug.get(card.getAttribute("href").replace(/\.html$/, ""));
    const small = card.querySelector("small");
    if (!r || !small || !(r.released_tracks > 0)) return;
    small.innerHTML = small.innerHTML.replace(/\d+ tracks?/, `${r.released_tracks} track${r.released_tracks === 1 ? "" : "s"}`);
    card.dataset.live = "1";
  });
}

async function releases(sb) {
  const box = document.getElementById("live-releases");
  if (!box) return;
  const { data, error } = await sb.rpc("site_releases", { p_limit: Number(box.dataset.limit) || 10 });
  if (error || !Array.isArray(data) || !data.length) return;
  box.querySelector("ul").innerHTML = data.map((r) => {
    const who = known.has(r.artist_slug) ? `<a href="${esc(r.artist_slug)}.html">${esc(r.artist_name)}</a>` : esc(r.artist_name);
    return `<li><strong>${esc(r.title)}</strong> – ${who}${r.release_type ? ` <small>(${esc(r.release_type)})</small>` : ""} <small>· ${esc(nice(r.release_date))}</small></li>`;
  }).join("");
  box.hidden = false;
}

(async () => {
  try {
    const sb = await supabase();
    await Promise.allSettled([roster(sb), releases(sb)]);
  } catch (e) {
    console.warn("DMF live data unavailable; showing the static page.", e);
  }
})();
