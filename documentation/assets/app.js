/* ============================================================
   TheGuild Documentation — shared app logic
   Injects sidebar + topbar, highlights current page, powers the
   client-side search and mobile menu.

   The SEARCH_INDEX below maps searchable terms to pages. It is
   deliberately small; each term points to the page that documents it.
   ============================================================ */

const NAV_GROUPS = [
  {
    title: "Getting Started",
    links: [
      { href: "index.html", label: "Overview", dot: "overview" },
      { href: "getting-started.html", label: "Setup & Prerequisites", dot: "setup" },
    ],
  },
  {
    title: "Architecture",
    links: [
      { href: "architecture.html", label: "Architecture", dot: "arch" },
      { href: "domain-model.html", label: "Domain Model", dot: "domain" },
      { href: "routes.html", label: "Routes & Pages", dot: "routes" },
      { href: "actions.html", label: "Server Actions", dot: "actions" },
      { href: "components.html", label: "UI Components", dot: "ui" },
    ],
  },
  {
    title: "Data & Security",
    links: [
      { href: "database.html", label: "Database & Migrations", dot: "db" },
      { href: "security.html", label: "Auth, Roles & RLS", dot: "security" },
    ],
  },
  {
    title: "Process",
    links: [
      { href: "engineering.html", label: "Engineering Process", dot: "agile" },
    ],
  },
];

const SEARCH_INDEX = [
  // page, label, path, keywords
  ["index.html", "Overview", "index", "home landing welcome product mission theguild"],
  ["getting-started.html", "Setup & Prerequisites", "getting-started", "install node npm docker supabase cli environment setup ports windows powershell start dev server prerequisites"],
  ["architecture.html", "Architecture", "architecture", "next.js 16 app router proxy middleware server components client components turbo pack stack design seo"],
  ["domain-model.html", "Domain Model", "domain-model", "ecosystem space content challenge project team curriculum grades terms units topics entities nouns relationships verbs rules"],
  ["routes.html", "Routes & Pages", "routes", "pages route layout dashboard login signup setup-password subdomain ecosystem console spaces lessons syllabus admin"],
  ["actions.html", "Server Actions", "actions", "server actions console onboarding create invite approve delegate space edit syllabus curriculum auth signout"],
  ["components.html", "UI Components", "components", "shadcn radix ui card button dialog form sidebar avatar badge tabs sheet table sonner toast cva"],
  ["database.html", "Database & Migrations", "database", "supabase postgres migration schema tables profiles ecosystems spaces memberships curricula lessons resources seed grants indexes enums"],
  ["security.html", "Auth, Roles & RLS", "security", "row level security rls policies grant roles superadmin program ecosystem space teacher learner mentor approval trigger cookie session invitation code subdomain slug"],
  ["engineering.html", "Engineering Process", "engineering", "agile sprint scrum backlog epic story definition of done working agreements roadmap rituals retro"],
];

function currentPage() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const file = parts.length ? parts[parts.length - 1] : "index.html";
  return file === "" ? "index.html" : file;
}

function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  const active = currentPage();
  let html = `
    <div class="sidebar-brand">
      <div class="logo">G</div>
      <div>
        <span class="brand-name">TheGuild</span>
        <span class="brand-tag">Developer Documentation</span>
      </div>
    </div>
    <nav class="sidebar-nav">`;
  for (const group of NAV_GROUPS) {
    html += `<div class="nav-group"><div class="nav-group-title">${group.title}</div>`;
    for (const link of group.links) {
      const cls = link.href === active ? "nav-link active" : "nav-link";
      html += `<a class="${cls}" href="${link.href}"><span class="dot"></span>${link.label}</a>`;
    }
    html += `</div>`;
  }
  html += `</nav><div class="sidebar-foot">TheGuild v0.1.0 &middot; docs for developers</div>`;
  sidebar.innerHTML = html;
}

function renderTopbar() {
  const topbar = document.getElementById("topbar");
  if (!topbar) return;
  const active = currentPage();
  let label = "Documentation";
  for (const group of NAV_GROUPS) {
    for (const link of group.links) {
      if (link.href === active) label = link.label;
    }
  }
  topbar.innerHTML = `
    <button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation">&#9776;</button>
    <div class="topbar-title">${label}</div>
    <div class="topbar-spacer"></div>
    <div class="search-wrap">
      <span class="search-icon">&#128269;</span>
      <input class="search-input" id="searchInput" type="search" placeholder="Search docs&hellip;" autocomplete="off" aria-label="Search documentation" />
      <div class="search-results" id="searchResults"></div>
    </div>`;
  const toggle = document.getElementById("menuToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });
  }
  initSearch();
}

function initSearch() {
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  if (!input || !results) return;

  input.addEventListener("focus", () => { if (input.value.trim()) showResults(input.value.trim()); });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) results.classList.remove("open");
  });
  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (!q) { results.classList.remove("open"); return; }
    showResults(q);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { results.classList.remove("open"); input.blur(); }
    if (e.key === "Enter") {
      const first = results.querySelector("a.search-item");
      if (first) window.location.href = first.getAttribute("href");
    }
  });

  function showResults(q) {
    const ql = q.toLowerCase();
    const tokens = ql.split(/\s+/).filter(Boolean);
    const hits = SEARCH_INDEX.filter(([, label]) => label.toLowerCase().includes(ql));
    const kwHits = SEARCH_INDEX.filter(([,,, kw]) => {
      const k = kw.toLowerCase();
      return tokens.some((t) => k.includes(t) || t.includes(k.slice(0, 3)));
    });
    const merged = hits.length ? hits : kwHits.slice(0, 6);
    if (!merged.length) {
      results.innerHTML = `<div class="search-no-results">No results for &ldquo;${escapeHtml(q)}&rdquo;</div>`;
    } else {
      results.innerHTML = `<div class="search-group-title">Pages</div>` + merged.map(([href, label, path]) => `
        <a class="search-item" href="${href}">${label}<span class="path">${path}.html</span></a>`).join("");
    }
    results.classList.add("open");
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
}

function renderFooterTitles() {
  // set page <h1> from nav as a fallback when body[data-title] holds it
  const dataTitle = document.body.getAttribute("data-title");
  if (dataTitle) {
    const h1 = document.querySelector("h1");
    if (h1 && !h1.textContent.trim()) h1.textContent = dataTitle;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
  renderTopbar();
  renderFooterTitles();

  // Clicking a sidebar link on mobile closes the drawer
  document.querySelectorAll("#sidebar a").forEach((a) => {
    a.addEventListener("click", () => document.getElementById("sidebar").classList.remove("open"));
  });

  // Copy buttons on code blocks
  document.querySelectorAll("pre").forEach((pre) => {
    const btn = document.createElement("button");
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    Object.assign(btn.style, {
      position: "absolute",
      top: "8px",
      right: "8px",
      fontSize: "11px",
      padding: "3px 9px",
      borderRadius: "6px",
      border: "1px solid #2a3140",
      background: "#1a2233",
      color: "#cdd5e4",
      cursor: "pointer",
    });
    pre.style.position = "relative";
    pre.parentNode.insertBefore(btn, pre.nextSibling);
    btn.addEventListener("click", async () => {
      const text = pre.innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied!";
      } catch {
        btn.textContent = "Copy failed";
      }
      setTimeout(() => (btn.textContent = "Copy"), 1400);
    });
  });

  // Simple scrollspy for the on-page table of contents
  const tocLinks = document.querySelectorAll(".toc a[href^='#']");
  if (tocLinks.length) {
    const headings = Array.from(tocLinks).map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tocLinks.forEach((a) => {
              a.style.fontWeight = a.getAttribute("href") === "#" + entry.target.id ? "700" : "400";
            });
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    headings.forEach((h) => spy.observe(h));
  }
});