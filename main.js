const API_BASE = "https://kitsu.io/api/edge";
const searchBtn = document.getElementById("searchBtn");
const searchBox = document.getElementById("searchBox");
const resultsDiv = document.getElementById("results");
const detailsDiv = document.getElementById("details");
const topList = document.getElementById("topList");
const sidebar = document.getElementById("sidebar");
const toggleSidebar = document.getElementById("toggleSidebar");

let currentPage = 0; // pagination index for popular manga
const perPage = 20;  // Kitsu max per request

// --- Sidebar toggle (mobile) ---
toggleSidebar.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// --- Initialize ---
window.addEventListener("DOMContentLoaded", () => {
  loadTopManga();
  loadSidebarTop100();
});

// --- Search handler ---
searchBtn.addEventListener("click", async () => {
  const query = searchBox.value.trim();
  if (!query) return;
  fetchManga(
    `${API_BASE}/manga?filter[text]=${encodeURIComponent(query)}`,
    "Search Results"
  );
});

// --- Load top manga (paginated) ---
async function loadTopManga(page = 0) {
  currentPage = page;
  const offset = page * perPage;
  const url = `${API_BASE}/manga?sort=popularityRank&page[limit]=${perPage}&page[offset]=${offset}`;
  await fetchManga(url, `Popular Manga (Page ${page + 1})`, true);
}

// --- Generic fetch for manga list ---
async function fetchManga(url, title, showPagination = false) {
  resultsDiv.innerHTML = `<h2>${title}</h2><p>Loading...</p>`;
  detailsDiv.innerHTML = "";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.data?.length) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    resultsDiv.innerHTML = `<h2>${title}</h2>`;
    const grid = document.createElement("div");
    grid.style.display = "flex";
    grid.style.flexWrap = "wrap";
    grid.style.justifyContent = "center";
    resultsDiv.appendChild(grid);

    // Render manga cards
    data.data.forEach((manga) => {
      const attrs = manga.attributes;
      const card = document.createElement("div");
      card.className = "manga-card";
      card.innerHTML = `
        <img src="${attrs.posterImage?.small || ""}" alt="${attrs.canonicalTitle}" />
        <h3>${attrs.canonicalTitle}</h3>
        <p>Rank #${attrs.popularityRank || "?"}</p>
      `;
      card.addEventListener("click", () => showDetails(manga));
      grid.appendChild(card);
    });

    // Pagination controls (optional)
    if (showPagination) {
      const pagination = document.createElement("div");
      pagination.className = "pagination";

      const prevBtn = document.createElement("button");
      prevBtn.textContent = "← Previous";
      prevBtn.disabled = currentPage === 0;
      prevBtn.addEventListener("click", () => loadTopManga(currentPage - 1));

      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next →";
      nextBtn.addEventListener("click", () => loadTopManga(currentPage + 1));

      pagination.appendChild(prevBtn);
      pagination.appendChild(nextBtn);
      resultsDiv.appendChild(pagination);
    }
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = "<p>Error loading manga.</p>";
  }
}

// --- Load Top 100 Manga in Sidebar ---
async function loadSidebarTop100() {
  topList.innerHTML = "<li>Loading...</li>";

  try {
    const total = 100;
    const pages = Math.ceil(total / perPage);
    let allManga = [];

    for (let i = 0; i < pages; i++) {
      const res = await fetch(
        `${API_BASE}/manga?sort=popularityRank&page[limit]=${perPage}&page[offset]=${
          i * perPage
        }`
      );
      const data = await res.json();
      if (data.data) allManga = allManga.concat(data.data);
    }

    topList.innerHTML = "";

    allManga.slice(0, 100).forEach((manga, index) => {
      const attrs = manga.attributes;
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${attrs.canonicalTitle}`;
      li.addEventListener("click", () => showDetails(manga));
      topList.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load top 100 manga:", err);
    topList.innerHTML = "<li>Error loading list</li>";
  }
}

// --- Show Manga Details ---
function showDetails(manga) {
  const attrs = manga.attributes;
  resultsDiv.innerHTML = "";
  detailsDiv.innerHTML = `
    <button onclick="loadTopManga(${currentPage})">← Back</button>
    <h2>${attrs.canonicalTitle}</h2>
    <img src="${attrs.posterImage?.large || ""}" style="max-width:200px; border-radius:10px;">
    <p><strong>Status:</strong> ${attrs.status}</p>
    <p><strong>Chapters:</strong> ${attrs.chapterCount || "?"}</p>
    <p><strong>Rank:</strong> #${attrs.popularityRank || "?"}</p>
    <p><strong>Synopsis:</strong></p>
    <p>${attrs.synopsis || "No synopsis available."}</p>
  `;
}
