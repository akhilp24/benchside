// Fills in the download buttons and the version list from this repo's GitHub releases,
// so publishing a release updates the page without a redeploy. Only published releases
// show; drafts (still being tested) don't.

const REPO = "akhilp24/benchside";
const RELEASES_PAGE = `https://github.com/${REPO}/releases`;

// The installers each release carries (names come from the Tauri build).
const KINDS = [
  { id: "windows", label: "Windows", match: /_x64-setup\.exe$/i, file: "Windows installer" },
  { id: "mac", label: "Mac (Apple Silicon)", match: /_aarch64\.dmg$/i, file: "Mac disk image" },
];

function detectOS() {
  const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent;
  if (/^win/i.test(p) || /Windows NT/.test(navigator.userAgent)) return "windows";
  if (/^mac/i.test(p) || /Macintosh/.test(navigator.userAgent)) return "mac";
  return null;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const size = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.round(b / 1e6)} MB`);
const day = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

// Release notes are short Markdown: paragraphs and "- " bullet lists are enough.
function notes(md) {
  if (!md || !md.trim()) return "";
  const out = [];
  let list = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.map((l) => `<li>${l}</li>`).join("")}</ul>`); list = []; } };
  for (const raw of md.split(/\r?\n/)) {
    const line = esc(raw.trim()).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>");
    if (/^[-*] /.test(raw.trim())) list.push(line.slice(2));
    else { flush(); if (line && !/^#+\s/.test(raw.trim())) out.push(`<p>${line}</p>`); }
  }
  flush();
  return out.join("");
}

function assetsOf(release) {
  return KINDS.map((k) => ({ ...k, asset: release.assets.find((a) => k.match.test(a.name)) })).filter((k) => k.asset);
}

function showLatest(release) {
  const os = detectOS();
  const files = assetsOf(release);
  const primary = document.getElementById("primary");
  const note = document.getElementById("primary-note");
  const others = document.getElementById("others");
  const mine = files.find((f) => f.id === os) || files[0];
  if (!mine) {
    note.textContent = `Version ${release.tag_name.replace(/^v/, "")} has no installers attached yet.`;
    return;
  }
  primary.href = mine.asset.browser_download_url;
  primary.textContent = `Download for ${mine.label}`;
  note.textContent = `Version ${release.tag_name.replace(/^v/, "")} · ${day(release.published_at)} · ${size(mine.asset.size)}`;
  others.innerHTML = files.filter((f) => f !== mine)
    .map((f) => `<a href="${esc(f.asset.browser_download_url)}">${esc(f.label)} (${size(f.asset.size)})</a>`)
    .concat(`<a href="#versions">Other versions</a>`).join("");
}

function showReleases(list) {
  const box = document.getElementById("releases");
  if (!list.length) {
    box.innerHTML = `<p class="muted">No versions published yet.</p>`;
    return;
  }
  box.innerHTML = list.map((r, i) => {
    const files = assetsOf(r);
    return `<article class="release">
      <div class="release-head">
        <h3>${esc(r.name || r.tag_name)}</h3>
        ${i === 0 ? `<span class="badge">Latest</span>` : ""}
        <span class="muted">${day(r.published_at)}</span>
      </div>
      <div class="body">${notes(r.body)}</div>
      <div class="assets">${files.map((f) => `<a href="${esc(f.asset.browser_download_url)}">${esc(f.file)} (${size(f.asset.size)})</a>`).join("") || `<span class="muted">No installers.</span>`}</div>
    </article>`;
  }).join("");
}

async function load() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=30`, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
    const list = (await res.json()).filter((r) => !r.draft && !r.prerelease)
      .sort((a, b) => b.published_at.localeCompare(a.published_at));
    if (list.length) showLatest(list[0]);
    else document.getElementById("primary-note").textContent = "The first version is on its way.";
    showReleases(list);
  } catch {
    document.getElementById("primary-note").innerHTML = `Couldn't reach GitHub just now. <a href="${RELEASES_PAGE}">See all downloads on GitHub</a>.`;
    document.getElementById("releases").innerHTML = `<p class="muted"><a href="${RELEASES_PAGE}">All versions are on GitHub.</a></p>`;
  }
}

// Install tabs: open the one for this computer.
function tabs() {
  const buttons = [...document.querySelectorAll("[data-tab]")];
  const select = (id) => {
    for (const b of buttons) b.setAttribute("aria-selected", String(b.dataset.tab === id));
    for (const p of document.querySelectorAll("[data-panel]")) p.hidden = p.dataset.panel !== id;
  };
  for (const b of buttons) b.addEventListener("click", () => select(b.dataset.tab));
  if (detectOS() === "mac") select("mac");
}

tabs();
load();
