// promo.html controller: renders packages from promo-packages.js and sends requests to public.promo_orders.
import { PROMO_PACKAGES, PROMO_DISCLAIMER, packageById, packageCardHTML, validatePromoOrder, todayLocal } from "./promo-packages.js";
import { supabase } from "./dmf-config.js";

const $ = (s, r = document) => r.querySelector(s);
const form = $("#promo-form");
const grid = $("#pkg-grid");

// Packages + disclaimer always come from the shared data file (replaces the pre-rendered copy).
grid.innerHTML = PROMO_PACKAGES.map(packageCardHTML).join("");
document.querySelectorAll("[data-disclaimer]").forEach((el) => (el.textContent = PROMO_DISCLAIMER));

const sel = form.elements.packageId;
sel.innerHTML = '<option value="">Choose a package…</option>' +
  PROMO_PACKAGES.map((p) => `<option value="${p.id}">${p.name} — $${p.serviceFee} fee${p.hasAdSpend ? ` + $${p.adSpendMin}+ ad spend` : ""}</option>`).join("");
form.elements.startDate.min = todayLocal();
if (!form.elements.startDate.value) form.elements.startDate.value = todayLocal();

function syncBudgetHint() {
  const p = packageById(sel.value);
  $("#budget-label").textContent = p?.hasAdSpend ? "Ad budget (USD)" : "Budget (USD)";
  $("#budget-hint").textContent = p?.hasAdSpend
    ? `Paid to the ad platform, separate from the DMF fee. Minimum $${p.adSpendMin}.`
    : "What you'd like to spend in total.";
}
sel.addEventListener("change", syncBudgetHint);

function pick(id) {
  if (!packageById(id)) return;
  sel.value = id; syncBudgetHint();
}
grid.addEventListener("click", (ev) => {
  const a = ev.target.closest("[data-pick]"); if (!a) return;
  pick(a.dataset.pick);
});
const fromUrl = new URLSearchParams(location.search).get("package");
if (fromUrl) pick(fromUrl);
syncBudgetHint();

function showErrors(errors) {
  form.querySelectorAll("[data-err]").forEach((el) => { el.textContent = errors[el.dataset.err] || ""; });
  const first = Object.keys(errors)[0];
  if (first && form.elements[first]?.focus) form.elements[first].focus();
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const status = $("#form-status");
  status.textContent = ""; status.className = "form-status";
  const f = {
    artistName: form.elements.artistName.value, email: form.elements.email.value, songLink: form.elements.songLink.value,
    packageId: sel.value, budget: form.elements.budget.value, startDate: form.elements.startDate.value,
    notes: form.elements.notes.value, rightsConfirmed: form.elements.rightsConfirmed.checked, website: form.elements.website.value,
  };
  const v = validatePromoOrder(f);
  if (!v.ok) { showErrors(v.errors); status.textContent = "Please fix the highlighted fields."; status.className = "form-status bad"; return; }
  showErrors({});
  const btn = $("#promo-submit"); btn.disabled = true; btn.textContent = "Sending…";
  try {
    const sb = await supabase();
    // No .select(): visitors can insert a request but can't read orders back (by design, RLS).
    const { error } = await sb.from("promo_orders").insert(v.row);
    if (error) throw error;
    form.hidden = true;
    $("#promo-sent").hidden = false;
    $("#promo-sent").focus();
  } catch (err) {
    console.warn("promo request failed", err);
    status.innerHTML = 'Couldn\'t send your request right now. Please try again in a minute, or email <a href="mailto:bighomiecash8346@gmail.com">bighomiecash8346@gmail.com</a>.';
    status.className = "form-status bad";
  } finally { btn.disabled = false; btn.textContent = "Send request"; }
});
