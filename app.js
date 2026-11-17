const FLOW_META = [
  { id: "muse", title: "Action 1｜Museを始める", purpose: "作りたいものを相談して、最初の一歩を踏み出す。", asset: "./assets/scene-muse.svg", tone: "#e9f2ff" },
  { id: "github", title: "Action 2｜GitHubに作品を残す", purpose: "作品の置き場所と変更の記録を作る。すでにアカウントがある人は途中からでOK。", asset: "./assets/scene-github.svg", tone: "#eaf7e9" },
  { id: "connect", title: "Action 3｜MuseとGitHubをつなぐ", purpose: "許可する範囲を確認して、作る・残すをつなげる。", asset: "./assets/scene-connect.svg", tone: "#fff0dc" }
];

const journeyRoot = document.querySelector("#journey");
const viewButtons = [...document.querySelectorAll("[data-view]")];
const views = {
  github: document.querySelector("#github-view"),
  muse: document.querySelector("#muse-view")
};

function showView(name, updateHash = true) {
  const selected = views[name] ? name : "github";
  for (const [key, view] of Object.entries(views)) view.hidden = key !== selected;
  viewButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === selected)));
  if (updateHash && location.hash !== "#" + selected) history.pushState(null, "", "#" + selected);
}

viewButtons.forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => showView(button.dataset.go)));
window.addEventListener("popstate", () => showView(location.hash.slice(1), false));
window.addEventListener("hashchange", () => showView(location.hash.slice(1), false));

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderFlow(flow, lines, index) {
  const section = document.createElement("section");
  section.className = "action";
  section.setAttribute("aria-labelledby", "flow-title-" + flow.id);
  const heading = document.createElement("div");
  heading.className = "action-head";
  heading.innerHTML = '<span class="action-index">0' + (index + 1) + '</span><div><h2 id="flow-title-' + flow.id + '">' + escapeHTML(flow.title) + '</h2><p>' + escapeHTML(flow.purpose) + '</p></div>';
  const strip = document.createElement("div");
  strip.className = "strip";
  strip.setAttribute("aria-label", flow.title + " 8ステップ");
  lines.forEach((line, stepIndex) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "step-card" + (stepIndex === lines.length - 1 ? " is-last" : "");
    card.setAttribute("aria-label", "ステップ" + (stepIndex + 1) + "。" + line);
    card.style.setProperty("--step-bg", flow.tone);
    const hint = stepIndex === lines.length - 1 ? "この流れはここまで ✓" : "タップして次へ →";
    card.innerHTML = '<span class="step-visual"><img src="' + flow.asset + '" alt="" width="180" height="125"></span><span class="step-copy"><span class="step-number">STEP ' + String(stepIndex + 1).padStart(2, "0") + ' / ' + String(lines.length).padStart(2, "0") + '</span><span class="step-dialogue">' + escapeHTML(line) + '</span><span class="step-hint">' + hint + '</span></span>';
    card.addEventListener("click", () => {
      if (stepIndex < lines.length - 1) {
        const next = strip.querySelectorAll(".step-card")[stepIndex + 1];
        next.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest", inline: "center" });
        next.focus({ preventScroll: true });
      }
    });
    strip.append(card);
    if (stepIndex < lines.length - 1) {
      const arrow = document.createElement("button");
      arrow.type = "button";
      arrow.className = "arrow";
      arrow.textContent = "→";
      arrow.setAttribute("aria-label", "ステップ" + (stepIndex + 2) + "へ進む");
      arrow.addEventListener("click", () => {
        const next = strip.querySelectorAll(".step-card")[stepIndex + 1];
        next.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest", inline: "center" });
        next.focus({ preventScroll: true });
      });
      strip.append(arrow);
    }
  });
  section.append(heading, strip);
  return section;
}

async function loadJourney() {
  try {
    const response = await fetch("./data/conversations.json");
    if (!response.ok) throw new Error("HTTP " + response.status);
    const conversations = await response.json();
    journeyRoot.replaceChildren(...FLOW_META.map((flow, index) => {
      const lines = conversations[flow.id];
      if (!Array.isArray(lines) || lines.length !== 8) throw new Error(flow.id + " の会話データは8件必要です");
      return renderFlow(flow, lines, index);
    }));
  } catch (error) {
    journeyRoot.innerHTML = '<p class="load-error">ガイドを読み込めませんでした。ページをGitHub PagesなどのWebサーバー上で開き、data/conversations.json が公開されているか確認してください。</p>';
    console.error(error);
  }
}

showView(location.hash.slice(1) || "github", false);
loadJourney();