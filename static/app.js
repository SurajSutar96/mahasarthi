/**
 * MahaSarthi Portal – app.js
 * Vanilla JS: schemes, search, jobs, village, chat, eligibility, comparison
 */

// ── Global State ──────────────────────────────────────────────────────────
const API_BASE = ""; // Same origin
let currentLang = "mr";
let chatLang = "mr";
let currentCategory = "all";
let chatHistory = [];
let allSchemes = [];
let searchTimer = null;
let isChatOpen = false;

// ── Translations ───────────────────────────────────────────────────────────
const T = {
  mr: {
    heroTitle: "महाराष्ट्र शासन योजना एकाच ठिकाणी",
    heroSubtitle: "सर्व सरकारी योजना, अनुदान आणि नोकरी माहिती",
    statSchemes: "योजना",
    statCategories: "श्रेणी",
    statDistricts: "जिल्हे",
    statAI: "AI सहाय्य",
    schemesSectionTitle: "सर्व योजना",
    searchResultsTitle: "शोध निकाल",
    viewDetails: "तपशील पाहा",
    officialSite: "अधिकृत साइट",
    eligibility: "पात्रता",
    welcomeMsg:
      "नमस्कार! मी MahaSarthi AI आहे. महाराष्ट्र शासनाच्या योजनांबाबत मला विचारा. मी मराठीत उत्तर देईन. 🙏",
  },
  en: {
    heroTitle: "Maharashtra Government Schemes – One Platform",
    heroSubtitle: "All government schemes, subsidies, and job information",
    statSchemes: "Schemes",
    statCategories: "Categories",
    statDistricts: "Districts",
    statAI: "AI Support",
    schemesSectionTitle: "All Schemes",
    searchResultsTitle: "Search Results",
    viewDetails: "View Details",
    officialSite: "Official Site",
    eligibility: "Eligibility",
    welcomeMsg:
      "Hello! I am MahaSarthi AI. Ask me about Maharashtra government schemes and I'll help you. 🙏",
  },
};

// ── Category badge config ─────────────────────────────────────────────────
const CATEGORY_BADGES = {
  farmer: {
    cls: "badge-farmer",
    icon: "🌾",
    labelMr: "शेतकरी",
    labelEn: "Farmer",
  },
  student: {
    cls: "badge-student",
    icon: "📚",
    labelMr: "विद्यार्थी",
    labelEn: "Student",
  },
  job: { cls: "badge-job", icon: "💼", labelMr: "नोकरी", labelEn: "Job" },
  village: {
    cls: "badge-village",
    icon: "🏘️",
    labelMr: "गाव",
    labelEn: "Village",
  },
  general: {
    cls: "badge-general",
    icon: "✨",
    labelMr: "सामान्य",
    labelEn: "General",
  },
};

// ── Tenant detection from URL ─────────────────────────────────────────────
function detectTenant() {
  const params = new URLSearchParams(window.location.search);
  const tenant = params.get("tenant") || params.get("role") || "general";
  const badge = document.getElementById("tenantBadge");
  if (badge)
    badge.textContent = tenant.charAt(0).toUpperCase() + tenant.slice(1);
  return tenant;
}

// ── Language toggle ───────────────────────────────────────────────────────
function setLanguage(lang) {
  currentLang = lang;
  document.getElementById("btnMr").classList.toggle("active", lang === "mr");
  document.getElementById("btnEn").classList.toggle("active", lang === "en");

  // Update static text
  const t = T[lang];
  setEl("heroTitle", t.heroTitle);
  setEl("heroSubtitle", t.heroSubtitle);
  setEl("statSchemes", t.statSchemes);
  setEl("statCategories", t.statCategories);
  setEl("statDistricts", t.statDistricts);
  setEl("statAI", t.statAI);
  setEl("schemesSectionTitle", t.schemesSectionTitle);
  setEl("searchResultsTitle", t.searchResultsTitle);

  // Update data-mr/data-en elements
  document.querySelectorAll("[data-mr]").forEach((el) => {
    el.textContent = lang === "mr" ? el.dataset.mr : el.dataset.en;
  });

  // Re-render cards with new language
  if (allSchemes.length) renderSchemeCards(allSchemes);
}

function setChatLang(lang) {
  chatLang = lang;
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── Scheme loading ─────────────────────────────────────────────────────────
async function loadSchemes(category = "all") {
  document.getElementById("schemesGrid").innerHTML = skeletonCards(6);
  setEl("schemesCount", "...");

  const params = new URLSearchParams();
  if (
    category &&
    category !== "all" &&
    category !== "job" &&
    category !== "village"
  ) {
    params.set("category", category);
  }

  // Detect tenant role
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get("role");
  if (role) params.set("role", role);

  try {
    const res = await fetch(`${API_BASE}/schemes?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allSchemes = data.schemes || [];
    renderSchemeCards(allSchemes);
    setEl(
      "schemesCount",
      `${allSchemes.length} ${currentLang === "mr" ? "योजना" : "schemes"}`,
    );
    populateCompareSelects(allSchemes);

    // Cache for offline
    try {
      localStorage.setItem(`schemes_${category}`, JSON.stringify(allSchemes));
    } catch (_) {}
  } catch (err) {
    // Try offline cache
    const cached = localStorage.getItem(`schemes_${category}`);
    if (cached) {
      allSchemes = JSON.parse(cached);
      renderSchemeCards(allSchemes);
      setEl("schemesCount", `${allSchemes.length} (cached)`);
    } else {
      document.getElementById("schemesGrid").innerHTML = errorState(
        currentLang === "mr"
          ? "डेटा लोड होऊ शकला नाही"
          : "Failed to load schemes",
        currentLang === "mr"
          ? "कृपया नेटवर्क तपासा"
          : "Please check your network",
      );
    }
  }
}

function renderSchemeCards(schemes) {
  if (!schemes.length) {
    document.getElementById("schemesGrid").innerHTML = emptyState();
    return;
  }
  document.getElementById("schemesGrid").innerHTML = schemes
    .map(schemeCard)
    .join("");
  document.getElementById("schemesCount").textContent =
    `${schemes.length} ${currentLang === "mr" ? "योजना" : "schemes"}`;
}

function schemeCard(s) {
  const lang = currentLang;
  const badge = CATEGORY_BADGES[s.category] || CATEGORY_BADGES.general;
  const name = lang === "mr" ? s.name_mr : s.name;
  const desc = lang === "mr" ? s.description_mr : s.description;
  const elig = lang === "mr" ? s.eligibility_mr : s.eligibility;
  const eligLabel = T[lang].eligibility;
  const viewLabel = T[lang].viewDetails;
  const siteLabel = T[lang].officialSite;

  return `
  <article class="scheme-card" data-id="${s.id}">
    <span class="card-category-badge ${badge.cls}">${badge.icon} ${lang === "mr" ? badge.labelMr : badge.labelEn}</span>
    <h3 class="card-title">${escHtml(name)}</h3>
    <p class="card-desc">${escHtml(desc)}</p>
    <div class="card-eligibility">
      <strong>${eligLabel}:</strong>
      ${escHtml(elig)}
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" onclick="askAboutScheme('${escHtml(s.name_mr)}')">🤖 ${viewLabel}</button>
      <a class="btn btn-outline" href="${escHtml(s.official_link)}" target="_blank" rel="noopener noreferrer">🌐 ${siteLabel}</a>
    </div>
  </article>`;
}

// ── Category tabs ─────────────────────────────────────────────────────────
function setCategory(btn, category) {
  currentCategory = category;
  document
    .querySelectorAll(".cat-tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");

  // Show/hide sections
  const jobsSection = document.getElementById("jobsSection");
  const villageSection = document.getElementById("villageFundSection");
  const schemesSection = document.getElementById("schemesSection");

  if (category === "job") {
    jobsSection.classList.remove("hidden");
    villageSection.classList.add("hidden");
    schemesSection.classList.add("hidden");
    loadJobs();
  } else if (category === "village") {
    jobsSection.classList.add("hidden");
    villageSection.classList.remove("hidden");
    schemesSection.classList.add("hidden");
  } else {
    jobsSection.classList.add("hidden");
    villageSection.classList.add("hidden");
    schemesSection.classList.remove("hidden");
    loadSchemes(category);
  }
}

// ── Jobs ──────────────────────────────────────────────────────────────────
async function loadJobs() {
  document.getElementById("jobsList").innerHTML =
    `<div class="skeleton-card"><div class="skeleton sk-title" style="height:60px;margin-bottom:0.5rem;"></div></div>`.repeat(
      4,
    );
  setEl("jobsCount", "...");
  try {
    const res = await fetch(`${API_BASE}/jobs`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const jobs = data.jobs || [];
    setEl(
      "jobsCount",
      `${jobs.length} ${currentLang === "mr" ? "नोकऱ्या" : "jobs"}`,
    );
    if (!jobs.length) {
      document.getElementById("jobsList").innerHTML = emptyState();
      return;
    }

    if (data.tavily_answer) {
      document.getElementById("jobsList").innerHTML =
        `<div class="eligibility-result show" style="margin-bottom:1rem;">${escHtml(data.tavily_answer)}</div>`;
    } else {
      document.getElementById("jobsList").innerHTML = "";
    }

    jobs.forEach((job) => {
      const card = document.createElement("div");
      card.className = "job-card";
      card.innerHTML = `
        <div class="job-icon">💼</div>
        <div class="job-info">
          <div class="job-title">${escHtml(job.title)}</div>
          <div class="job-dept">${escHtml(job.department || "Maharashtra Government")}</div>
        </div>
        <a class="btn btn-outline" href="${escHtml(job.link)}" target="_blank" rel="noopener" style="font-size:0.75rem;padding:6px 12px;">
          ${currentLang === "mr" ? "पाहा" : "View"} →
        </a>`;
      document.getElementById("jobsList").appendChild(card);
    });
  } catch {
    document.getElementById("jobsList").innerHTML = errorState(
      currentLang === "mr"
        ? "नोकऱ्या लोड होऊ शकल्या नाहीत"
        : "Could not load jobs",
    );
  }
}

// ── Village funds ─────────────────────────────────────────────────────────
async function fetchVillageFunds() {
  const village = document.getElementById("villageInput").value.trim();
  if (!village) return;
  const btn = document.getElementById("villageSearchBtn");
  btn.disabled = true;
  btn.textContent = "...";
  document.getElementById("villageResult").innerHTML =
    `<div class="skeleton" style="height:160px;border-radius:8px;"></div>`;

  try {
    const res = await fetch(
      `${API_BASE}/village-donations/${encodeURIComponent(village)}`,
    );
    const data = await res.json();
    const records = data.records || [];

    if (!records.length) {
      document.getElementById("villageResult").innerHTML = emptyState(
        currentLang === "mr"
          ? `'${village}' साठी माहिती उपलब्ध नाही`
          : `No data found for '${village}'`,
      );
    } else {
      let html = `<table class="donation-table">
        <thead><tr>
          <th>${currentLang === "mr" ? "वर्ष" : "Year"}</th>
          <th>${currentLang === "mr" ? "रक्कम" : "Amount"}</th>
          <th>${currentLang === "mr" ? "योजना" : "Scheme"}</th>
          <th>${currentLang === "mr" ? "तपशील" : "Description"}</th>
          <th>${currentLang === "mr" ? "स्रोत" : "Source"}</th>
        </tr></thead><tbody>`;
      records.forEach((r) => {
        html += `<tr>
          <td>${escHtml(r.year)}</td>
          <td><strong>${escHtml(r.amount)}</strong></td>
          <td>${escHtml(r.scheme)}</td>
          <td>${escHtml(r.description)}</td>
          <td><span style="font-size:0.75rem;color:var(--primary);">${escHtml(r.source || "DB")}</span></td>
        </tr>`;
      });
      html += `</tbody></table>`;
      if (data.tavily_answer) {
        html =
          `<div class="eligibility-result show" style="margin-bottom:1rem;">${escHtml(data.tavily_answer)}</div>` +
          html;
      }
      document.getElementById("villageResult").innerHTML = html;
    }
  } catch {
    document.getElementById("villageResult").innerHTML = errorState(
      currentLang === "mr" ? "डेटा लोड होऊ शकला नाही" : "Failed to load data",
    );
  } finally {
    btn.disabled = false;
    btn.textContent = currentLang === "mr" ? "शोधा" : "Search";
  }
}

// ── Global search (debounced) ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      const q = searchInput.value.trim();
      if (!q) {
        closeSearch();
        return;
      }
      searchTimer = setTimeout(() => performSearch(q), 500);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        clearTimeout(searchTimer);
        const q = searchInput.value.trim();
        if (q) performSearch(q);
      }
    });
  }
});

async function performSearch(q) {
  document.getElementById("searchPanel").classList.add("show");
  document.getElementById("searchResultsList").innerHTML =
    `<div class="skeleton" style="height:80px;border-radius:8px;margin-bottom:0.5rem;"></div>`.repeat(
      3,
    );

  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const results = data.results || [];

    if (!results.length) {
      document.getElementById("searchResultsList").innerHTML = emptyState(
        currentLang === "mr" ? "निकाल आढळला नाही" : "No results found",
      );
      return;
    }

    let html = "";
    if (data.answer) {
      html += `<div class="eligibility-result show" style="margin-bottom:1rem;"><strong>AI Summary:</strong> ${escHtml(data.answer)}</div>`;
    }
    results.forEach((r) => {
      html += `<div class="search-result-item">
        <div class="search-result-title">${escHtml(r.title)}</div>
        <div class="search-result-url"><a href="${escHtml(r.url)}" target="_blank" rel="noopener">${escHtml(r.url)}</a></div>
        <div class="search-result-snippet">${escHtml(r.content?.substring(0, 200))}...</div>
      </div>`;
    });
    document.getElementById("searchResultsList").innerHTML = html;
  } catch {
    document.getElementById("searchResultsList").innerHTML = errorState(
      currentLang === "mr" ? "शोध अयशस्वी" : "Search failed",
    );
  }
}

function closeSearch() {
  document.getElementById("searchPanel").classList.remove("show");
  document.getElementById("globalSearch").value = "";
}
function clearSearch() {
  closeSearch();
}

// ── AI Eligibility Checker ────────────────────────────────────────────────
async function checkEligibility() {
  const role = document.getElementById("eRole").value;
  const income = document.getElementById("eIncome").value;
  const district =
    document.getElementById("eDistrict").value.trim() || "Maharashtra";
  const btn = document.getElementById("eligibilityBtn");
  const result = document.getElementById("eligibilityResult");

  btn.disabled = true;
  btn.innerHTML = "⏳ ...";
  result.innerHTML =
    '<div class="skeleton" style="height:80px;border-radius:8px;"></div>';
  result.classList.add("show");

  try {
    const res = await fetch(`${API_BASE}/eligibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role,
        income_range: income,
        district,
        language: currentLang,
      }),
    });
    const data = await res.json();
    let html = `<p style="white-space:pre-wrap;line-height:1.7;">${escHtml(data.ai_explanation || "")}</p>`;
    if (data.suggested_schemes?.length) {
      html += `<div style="margin-top:1rem;"><strong>${currentLang === "mr" ? "सुचवलेल्या योजना:" : "Suggested Schemes:"}</strong>
        <ul style="margin-top:0.5rem;padding-left:1.25rem;">`;
      data.suggested_schemes.slice(0, 5).forEach((s) => {
        html += `<li style="margin-bottom:0.3rem;">
          <a href="${escHtml(s.official_link)}" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600;">
            ${escHtml(currentLang === "mr" ? s.name_mr : s.name)}
          </a>
        </li>`;
      });
      html += "</ul></div>";
    }
    result.innerHTML = html;
  } catch {
    result.innerHTML = errorState(
      currentLang === "mr" ? "AI सेवा अनुपलब्ध" : "AI service unavailable",
    );
  } finally {
    btn.disabled = false;
    btn.innerHTML = `🤖 <span>${currentLang === "mr" ? "पात्रता तपासा" : "Check Eligibility"}</span>`;
  }
}

// ── Scheme Comparison ─────────────────────────────────────────────────────
function populateCompareSelects(schemes) {
  ["compareA", "compareB"].forEach((id) => {
    const sel = document.getElementById(id);
    const current = sel.value;
    sel.innerHTML = `<option value="">-- ${currentLang === "mr" ? "योजना निवडा" : "Select scheme"} --</option>`;
    schemes.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = currentLang === "mr" ? s.name_mr : s.name;
      if (opt.value === current) opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

function renderComparison() {
  const aId = document.getElementById("compareA").value;
  const bId = document.getElementById("compareB").value;
  const table = document.getElementById("compareTable");
  if (!aId || !bId || aId === bId) {
    table.classList.remove("show");
    return;
  }

  const a = allSchemes.find((s) => s.id === aId);
  const b = allSchemes.find((s) => s.id === bId);
  if (!a || !b) return;

  const lang = currentLang;
  document.getElementById("compareAHeader").textContent =
    lang === "mr" ? a.name_mr : a.name;
  document.getElementById("compareBHeader").textContent =
    lang === "mr" ? b.name_mr : b.name;

  const rows = [
    ["श्रेणी / Category", a.category, b.category],
    [
      "पात्रता / Eligibility",
      lang === "mr" ? a.eligibility_mr : a.eligibility,
      lang === "mr" ? b.eligibility_mr : b.eligibility,
    ],
    [
      "वर्णन / Description",
      lang === "mr" ? a.description_mr : a.description,
      lang === "mr" ? b.description_mr : b.description,
    ],
    [
      "अधिकृत साइट / Official Site",
      `<a href="${escHtml(a.official_link)}" target="_blank" rel="noopener">🔗 Link</a>`,
      `<a href="${escHtml(b.official_link)}" target="_blank" rel="noopener">🔗 Link</a>`,
    ],
  ];

  document.getElementById("compareBody").innerHTML = rows
    .map(
      ([label, av, bv]) =>
        `<tr><td>${label}</td><td>${av}</td><td>${bv}</td></tr>`,
    )
    .join("");
  table.classList.add("show");
}

// ── Chat ──────────────────────────────────────────────────────────────────
function toggleChat() {
  isChatOpen = !isChatOpen;
  document.getElementById("chatDrawer").classList.toggle("open", isChatOpen);
  document.getElementById("chatBadge").classList.remove("show");
  if (isChatOpen && !chatHistory.length) {
    initChat();
    document.getElementById("chatInput").focus();
  }
}

function initChat() {
  // Load from localStorage
  const saved = localStorage.getItem("mahaSarthiChat");
  if (saved) {
    try {
      chatHistory = JSON.parse(saved);
      replayChat();
      return;
    } catch (_) {}
  }
  // Welcome message
  const welcome = T[chatLang].welcomeMsg;
  appendChatMsg("ai", welcome);
  chatHistory.push({ role: "ai", text: welcome });
}

function replayChat() {
  const container = document.getElementById("chatMessages");
  container.innerHTML = "";
  chatHistory.forEach((m) => {
    appendChatMsg(m.role, m.text, m.sources);
  });
}

async function sendChat() {
  const input = document.getElementById("chatInput");
  const btn = document.getElementById("chatSendBtn");
  const msg = input.value.trim();
  if (!msg) return;

  input.value = "";
  input.style.height = "auto";
  btn.disabled = true;

  appendChatMsg("user", msg);
  chatHistory.push({ role: "user", text: msg });

  // Typing indicator
  const typingId = "typing_" + Date.now();
  const typingEl = document.createElement("div");
  typingEl.id = typingId;
  typingEl.className = "chat-msg msg-ai";
  typingEl.innerHTML = `
    <div class="chat-msg-icon">🤖</div>
    <div class="chat-msg-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    </div>`;
  document.getElementById("chatMessages").appendChild(typingEl);
  scrollChat();

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, language: chatLang }),
    });

    typingEl.remove();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 429) {
        appendChatMsg(
          "ai",
          chatLang === "mr"
            ? "⚠️ एक मिनिटात जास्त संदेश पाठवले. कृपया थांबा."
            : "⚠️ Rate limit exceeded. Please wait a minute.",
        );
      } else {
        appendChatMsg("ai", `Error: ${err.detail || res.statusText}`);
      }
      return;
    }

    const data = await res.json();
    appendChatMsg("ai", data.answer, data.sources);
    chatHistory.push({ role: "ai", text: data.answer, sources: data.sources });

    // Save to localStorage
    try {
      localStorage.setItem(
        "mahaSarthiChat",
        JSON.stringify(chatHistory.slice(-40)),
      );
    } catch (_) {}
  } catch (err) {
    typingEl.remove();
    appendChatMsg(
      "ai",
      chatLang === "mr"
        ? "❌ नेटवर्क त्रुटी. कृपया पुन्हा प्रयत्न करा."
        : "❌ Network error. Please try again.",
    );
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

function appendChatMsg(role, text, sources = []) {
  const container = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `chat-msg ${role === "user" ? "user" : "msg-ai"}`;

  let sourcesHtml = "";
  if (sources && sources.length) {
    sourcesHtml = `<div class="chat-msg-sources">📎 `;
    sourcesHtml += sources
      .slice(0, 2)
      .map(
        (s) =>
          `<a href="${escHtml(s.url)}" target="_blank" rel="noopener">${escHtml(s.title?.substring(0, 40) || s.url)}</a>`,
      )
      .join(" · ");
    sourcesHtml += "</div>";
  }

  div.innerHTML = `
    <div class="chat-msg-icon">${role === "user" ? "👤" : "🤖"}</div>
    <div class="chat-msg-bubble">
      <span style="white-space:pre-wrap;">${escHtml(text)}</span>
      ${sourcesHtml}
    </div>`;
  container.appendChild(div);
  scrollChat();
}

function scrollChat() {
  const container = document.getElementById("chatMessages");
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

// Quick-ask about a specific scheme from card
function askAboutScheme(schemeName) {
  if (!isChatOpen) toggleChat();
  setTimeout(() => {
    document.getElementById("chatInput").value =
      `${schemeName} ${chatLang === "mr" ? "बद्दल माहिती द्या" : "details please"}`;
    sendChat();
  }, 350);
}

// Handle Enter key in chat
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("chatInput");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });
    // Auto-grow textarea
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 100) + "px";
    });
  }
});

// ── Utils ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function skeletonCards(n) {
  return Array(n)
    .fill(0)
    .map(
      () => `
    <div class="skeleton-card">
      <div class="skeleton sk-badge"></div>
      <div class="skeleton sk-title"></div>
      <div class="skeleton sk-title-2"></div>
      <div class="skeleton sk-desc"></div>
      <div class="skeleton sk-desc-2"></div>
      <div class="skeleton sk-box"></div>
      <div class="skeleton sk-btns"></div>
    </div>`,
    )
    .join("");
}

function errorState(title = "Error", msg = "") {
  return `<div class="error-state">
    <div class="state-icon">❌</div>
    <h3>${escHtml(title)}</h3>
    ${msg ? `<p>${escHtml(msg)}</p>` : ""}
  </div>`;
}

function emptyState(msg = "") {
  return `<div class="empty-state">
    <div class="state-icon">🔍</div>
    <h3>${msg || (currentLang === "mr" ? "काहीही सापडले नाही" : "Nothing found")}</h3>
  </div>`;
}

// ── Offline detection ─────────────────────────────────────────────────────
window.addEventListener("online", () =>
  document.getElementById("offlineBanner").classList.remove("show"),
);
window.addEventListener("offline", () =>
  document.getElementById("offlineBanner").classList.add("show"),
);

// ── Service Worker registration ───────────────────────────────────────────
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/static/sw.js").catch(() => {});
}

// ── Init ─────────────────────────────────────────────────────────────────
detectTenant();
loadSchemes("all");

// Show new-chat badge on bubble after 3s
setTimeout(() => {
  if (!isChatOpen) document.getElementById("chatBadge").classList.add("show");
}, 3000);
