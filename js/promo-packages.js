// DMF Promo package menu for dmfcorporation.biz — the ONE place the site's promo prices and copy live.
// Mirrors the app's src/lib/promoConfig.ts (Cashmire8346/dmf-ecosystem). Final prices set by Deangelo 2026-11-20.
// To change a price, edit serviceFee / adSpendMin here AND in the app's promoConfig.ts.
//
// House rules: real ads on the platforms' own ad systems, DMF-owned playlists, real DJ pools, real curators,
// creative work. Never bought subscribers/followers/watch hours/streams, never bots. No Spotify editorial claims.

export const PROMO_PACKAGES = [
  {
    id: "youtube_ads", name: "YouTube Ad Campaign", channel: "YouTube", hasAdSpend: true,
    serviceFee: 35, adSpendMin: 50, spendTo: "Google",
    summary: "Real Google/YouTube ads (in-stream and in-feed) set up and run by DMF on your official video.",
    includes: ["Audience + targeting setup", "Ad creative check against YouTube policy", "Campaign run and budget pacing", "End-of-campaign report: views, clicks, cost"],
    fineprint: "Ad spend goes to Google, billed separately from the DMF fee. Views come from real people who chose to watch your ad; results vary.",
  },
  {
    id: "meta_ads", name: "Instagram / Facebook Ad Campaign", channel: "Meta", hasAdSpend: true,
    serviceFee: 35, adSpendMin: 50, spendTo: "Meta",
    summary: "Meta ads (Reels, Stories, Feed) that send real listeners to your song or profile.",
    includes: ["Audience + targeting setup", "Ad copy and creative selection", "Campaign run and budget pacing", "End-of-campaign report: reach, clicks, cost"],
    fineprint: "Ad spend goes to Meta, billed separately from the DMF fee. No followers are bought; results vary.",
  },
  {
    id: "tiktok_ads", name: "TikTok Ad Campaign", channel: "TikTok", hasAdSpend: true,
    serviceFee: 35, adSpendMin: 50, spendTo: "TikTok",
    summary: "TikTok ads (In-Feed / Spark Ads) on your sound or a hook clip, run through TikTok's ad manager.",
    includes: ["Audience + targeting setup", "Spark Ad authorization help", "Campaign run and budget pacing", "End-of-campaign report: views, clicks, cost"],
    fineprint: "Ad spend goes to TikTok, billed separately from the DMF fee. Results vary.",
  },
  {
    id: "dmf_playlist", name: "DMF Playlist Submission", channel: "Spotify (DMF playlists)", hasAdSpend: false,
    serviceFee: 10,
    summary: "We review your song for DMF-owned playlists. If it fits and is accepted, it stays on for at least 30 days.",
    includes: ["Listen + fit review by DMF", "If accepted: placement on a DMF-owned playlist for 30+ days", "Decision either way"],
    fineprint: "DMF-owned playlists only. Not a Spotify editorial playlist; DMF has no Spotify editorial partnership. Acceptance is not guaranteed.",
  },
  {
    id: "dj_pool", name: "DJ Pool Submission", channel: "DJ pools", hasAdSpend: false,
    serviceFee: 20,
    summary: "We prepare clean/dirty/intro edits info and submit your record to DJ pools for working DJs to download.",
    includes: ["Metadata + version check", "Submission to DJ pools", "Download/feedback report when the pool provides one"],
    fineprint: "Pools decide what they carry, and DJs decide what they play. No spins are guaranteed.",
  },
  {
    id: "curator_pitch", name: "Independent Curator Pitch", channel: "Independent curators", hasAdSpend: false,
    serviceFee: 30,
    summary: "We write a pitch and send your song to independent playlist curators and blogs that fit its sound.",
    includes: ["Pitch written by DMF", "Hand-picked list of real, active curators", "Report of who responded and any adds"],
    fineprint: "Pitched, not guaranteed. Curators decide on their own; DMF never pays for placements.",
  },
  {
    id: "hook_clips", name: "Short-Form Hook Clip Pack", channel: "Reels / Shorts / TikTok", hasAdSpend: false,
    serviceFee: 40,
    summary: "Vertical hook clips of your song with synced lyric captions, made in the DMF Video Studio, ready to post or run as ads.",
    includes: ["Hook section picked with you", "Beat-cut clips from your photos/footage, lyric captions", "Exports in 9:16, 1:1 and 16:9"],
    fineprint: "You supply the photos/footage or approve what we use. Creative only; posting and ads are separate.",
  },
];

export const PROMO_DISCLAIMER =
  "DMF Promo uses real ads and reaches real listeners only. We never sell subscribers, followers, watch hours, or streams, and we never use bots. " +
  "DMF is not a Spotify editorial partner, and no playlist placement is guaranteed. Results vary and no numbers are guaranteed. " +
  "Ad spend is paid to the ad platform and shown separately from DMF's service fee.";

export const packageById = (id) => PROMO_PACKAGES.find((p) => p.id === id);
export const adSpendLabel = (p) => (p.hasAdSpend ? `+ ad spend from $${p.adSpendMin}, paid to ${p.spendTo}` : null);

// ---------- validation: same rules as the app (src/lib/promo.ts) and the promo_orders table checks ----------
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SONG_HOSTS = ["open.spotify.com", "spotify.link", "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "music.apple.com", "itunes.apple.com"];

export function songPlatform(link) {
  let u;
  try { u = new URL(String(link).trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const h = u.hostname.toLowerCase();
  if (!SONG_HOSTS.includes(h)) return null;
  if (u.pathname === "/" || u.pathname === "") return null;
  return h.includes("spotify") ? "spotify" : h.includes("apple") ? "apple" : "youtube";
}

function isISODate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(`${d}T00:00:00Z`);
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
}

/** Today as YYYY-MM-DD in the visitor's own time zone. */
export function todayLocal() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

/** f: { artistName, email, songLink, packageId, budget, startDate, notes, rightsConfirmed, website(honeypot) } */
export function validatePromoOrder(f, today = todayLocal()) {
  const e = {};
  const artist = (f.artistName ?? "").trim();
  const email = (f.email ?? "").trim();
  const link = (f.songLink ?? "").trim();
  const notes = (f.notes ?? "").trim();
  const pkg = packageById(f.packageId);

  if (f.website) e.website = "Spam check failed.";
  if (!artist) e.artistName = "Artist name is required.";
  else if (artist.length > 120) e.artistName = "Keep the artist name under 120 characters.";
  if (!EMAIL.test(email) || email.length > 254) e.email = "Enter a valid email address.";
  if (!songPlatform(link) || link.length > 500) e.songLink = "Paste a Spotify, YouTube or Apple Music link (https://…).";
  if (!pkg) e.packageId = "Choose a package.";

  const budgetStr = String(f.budget ?? "").trim().replace(/[$,]/g, "");
  const budget = budgetStr === "" ? NaN : Number(budgetStr);
  if (!Number.isFinite(budget) || budget < 0) e.budget = "Enter a budget in dollars (0 or more).";
  else if (budget > 100000) e.budget = "For budgets over $100,000, email DMF directly.";
  else if (pkg?.hasAdSpend && budget < (pkg.adSpendMin ?? 0)) e.budget = `Ad campaigns need at least $${pkg.adSpendMin} in ad spend.`;

  if (!isISODate(f.startDate ?? "")) e.startDate = "Pick a start date.";
  else if (f.startDate < today) e.startDate = "Start date can't be in the past.";

  if (notes.length > 2000) e.notes = "Keep notes under 2,000 characters.";
  if (f.rightsConfirmed !== true) e.rightsConfirmed = "You must confirm you own or control the rights to this song.";

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    row: {
      artist_name: artist, email: email.toLowerCase(), song_link: link, package_id: pkg.id,
      budget: Math.round(budget * 100) / 100, start_date: f.startDate, notes, rights_confirmed: true,
    },
  };
}

// ---------- markup (used by promo.js at runtime and to pre-render promo.html for search engines) ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function packageCardHTML(p) {
  const spend = adSpendLabel(p);
  return `<div class="pkg" id="pkg-${p.id}" data-pkg="${p.id}">` +
    `<small class="pkg-ch">${esc(p.channel)}</small>` +
    `<h3>${esc(p.name)}</h3>` +
    `<div class="price"><b>$${p.serviceFee}</b> <small>DMF service fee</small></div>` +
    (spend ? `<div class="spend">${esc(spend)} (separate from the fee)</div>` : "") +
    `<p>${esc(p.summary)}</p>` +
    `<ul>${p.includes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` +
    `<p class="fine">${esc(p.fineprint)}</p>` +
    `<a class="btn" href="#request" data-pick="${p.id}">Request this</a></div>`;
}
