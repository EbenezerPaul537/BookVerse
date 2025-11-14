/**
 * BookHub — GitHub-like UI with interactions
 * Features:
 * - local sample book DB
 * - genre filter, search, global search
 * - animated reveal, modal detail, favorites (localStorage)
 * - favorites pane, keyboard accessibility, theme toggle
 */

const books = {
  fantasy: [
    { title: "The Hobbit", author: "J.R.R. Tolkien", cover: "https://covers.openlibrary.org/b/id/6979861-L.jpg", summary: "An epic quest of a hobbit and company." },
    { title: "Name of the Wind", author: "Patrick Rothfuss", cover: "https://covers.openlibrary.org/b/id/8231851-L.jpg", summary: "A gifted young man's journey to legend." }
  ],
  romance: [
    { title: "Pride & Prejudice", author: "Jane Austen", cover: "https://covers.openlibrary.org/b/id/8226191-L.jpg", summary: "Classic romance and social wit." },
    { title: "The Fault in Our Stars", author: "John Green", cover: "https://covers.openlibrary.org/b/id/7279251-L.jpg", summary: "A tender, witty love story." }
  ],
  mystery: [
    { title: "Gone Girl", author: "Gillian Flynn", cover: "https://covers.openlibrary.org/b/id/8231856-L.jpg", summary: "Twisty psychological thriller." },
    { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", cover: "https://covers.openlibrary.org/b/id/8108691-L.jpg", summary: "A gothic Sherlock Holmes mystery." }
  ],
  "sci-fi": [
    { title: "Dune", author: "Frank Herbert", cover: "https://covers.openlibrary.org/b/id/8101348-L.jpg", summary: "Desert planet, politics and prophecy." },
    { title: "The Martian", author: "Andy Weir", cover: "https://covers.openlibrary.org/b/id/8373590-L.jpg", summary: "A stranded astronaut's fight to survive." }
  ],
  "non-fiction": [
    { title: "Sapiens", author: "Yuval Noah Harari", cover: "https://covers.openlibrary.org/b/id/8165261-L.jpg", summary: "A brief history of humankind." },
    { title: "Atomic Habits", author: "James Clear", cover: "https://covers.openlibrary.org/b/id/9251976-L.jpg", summary: "Tiny changes, remarkable results." }
  ]
};

// --- Elements
const genreEl = document.getElementById('genre');
const searchEl = document.getElementById('search');
const suggestBtn = document.getElementById('suggestBtn');
const bookGrid = document.getElementById('book-grid');
const countEl = document.getElementById('count');
const emptyEl = document.getElementById('empty');
const statusEl = document.getElementById('status');
const globalSearch = document.getElementById('global-search');

const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');

const favsPane = document.getElementById('favs-pane');
const openFavsBtn = document.getElementById('open-favs');
const closeFavsBtn = document.getElementById('close-favs');
const favListEl = document.getElementById('fav-list');
const favCount = document.getElementById('fav-count');
const clearFavsBtn = document.getElementById('clear-favs');

const themeToggle = document.getElementById('theme-toggle');

// --- State
let favorites = JSON.parse(localStorage.getItem('bookhub:favs') || '[]');
let lastResults = [];

// --- Helpers
function flattenDB() {
  return Object.values(books).flat();
}
function renderCount(n){
  countEl.textContent = `${n} book${n!==1?'s':''}`;
}
function showEmpty(show){
  emptyEl.style.display = show ? 'block' : 'none';
}
function persistFavs(){ localStorage.setItem('bookhub:favs', JSON.stringify(favorites)); }
function updateFavsUI(){
  favListEl.innerHTML = '';
  if(favorites.length === 0){
    favListEl.innerHTML = `<div class="fav-item">No favorites yet.</div>`;
  } else {
    favorites.forEach(b => {
      const d = document.createElement('div'); d.className = 'fav-item';
      d.innerHTML = `<div>${b.title} <div class="muted" style="font-size:12px">${b.author}</div></div>
        <div><button class="btn" data-title="${escapeHtml(b.title)}" data-author="${escapeHtml(b.author)}">Remove</button></div>`;
      favListEl.appendChild(d);
    });
  }
  favCount.textContent = favorites.length;
}

// escape utility for attributes in this simple UI
function escapeHtml(s){ return String(s).replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

// --- Render book grid
function makeCard(book){
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;

  // cover
  const cover = document.createElement('div');
  cover.className = 'cover';
  cover.style.backgroundImage = `url(${book.cover})`;

  // title, author
  const title = document.createElement('h3'); title.textContent = book.title;
  const author = document.createElement('p'); author.textContent = book.author;

  // actions
  const meta = document.createElement('div'); meta.className = 'meta';
  const pill = document.createElement('span'); pill.className = 'pill'; pill.textContent = 'Details';
  const favBtn = document.createElement('button'); favBtn.className = 'btn'; favBtn.textContent = '❤';

  // event: open modal
  pill.addEventListener('click', () => openModal(book));
  cover.addEventListener('click', () => openModal(book));
  title.addEventListener('click', () => openModal(book));
  card.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') openModal(book); });

  // favorite toggle
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const exists = favorites.find(f => f.title === book.title && f.author === book.author);
    if(!exists){
      favorites.push(book);
      favBtn.classList.add('active');
    } else {
      favorites = favorites.filter(f => !(f.title === book.title && f.author === book.author));
      favBtn.classList.remove('active');
    }
    persistFavs(); updateFavsUI();
  });

  meta.appendChild(pill); meta.appendChild(favBtn);

  card.appendChild(cover);
  card.appendChild(title);
  card.appendChild(author);
  card.appendChild(meta);
  return card;
}

function renderResults(list){
  bookGrid.innerHTML = '';
  lastResults = list;
  if(!list.length){
    renderCount(0); showEmpty(true); return;
  }
  showEmpty(false);
  renderCount(list.length);
  // staggered append for subtle animation
  list.forEach((b,i) => {
    setTimeout(()=> {
      const card = makeCard(b);
      bookGrid.appendChild(card);
    }, i * 90);
  });
}

// --- Modal
function openModal(book){
  modalContent.innerHTML = `
    <h2 style="margin-top:0">${book.title}</h2>
    <p class="muted">${book.author}</p>
    <div style="display:flex;gap:18px;align-items:flex-start;margin-top:12px">
      <img src="${book.cover}" alt="${book.title}" style="width:140px;height:200px;object-fit:cover;border-radius:6px">
      <div><p>${book.summary || 'No summary available.'}</p></div>
    </div>
  `;
  modal.setAttribute('aria-hidden','false');
  modal.style.display = 'flex';
}
function closeModal(){
  modal.setAttribute('aria-hidden','true');
  modal.style.display = 'none';
}

// --- Search & Filter logic
function filterAndSearch(){
  const genre = genreEl.value;
  const q = (searchEl.value || '').trim().toLowerCase();
  let results = [];
  if(genre){
    results = (books[genre] || []).slice();
  } else {
    results = flattenDB();
  }
  if(globalSearch && globalSearch.value.trim()){
    // global search (search input in header) takes precedence if non-empty
    const g = globalSearch.value.trim().toLowerCase();
    results = results.filter(b => b.title.toLowerCase().includes(g) || b.author.toLowerCase().includes(g));
    statusEl.textContent = `Results for "${globalSearch.value}"`;
  } else {
    statusEl.textContent = '';
  }
  if(q){
    results = results.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }
  renderResults(results);
}

// --- Favorites pane toggles
function openFavs(){ favsPane.classList.add('open'); favsPane.setAttribute('aria-hidden','false'); }
function closeFavs(){ favsPane.classList.remove('open'); favsPane.setAttribute('aria-hidden','true'); }

// --- init events
document.addEventListener('DOMContentLoaded', () => {
  updateFavsUI();
  renderResults([]); // empty initial

  suggestBtn.addEventListener('click', (e) => { e.preventDefault(); filterAndSearch(); });

  // header global search quick
  globalSearch.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') filterAndSearch();
  });

  // modal close
  if(modalClose){
    modalClose.addEventListener('click', closeModal);
  }
  modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

  // favorites pane
  openFavsBtn.addEventListener('click', () => {
    openFavs();
  });
  closeFavsBtn.addEventListener('click', closeFavs);
  clearFavsBtn.addEventListener('click', () => {
    if(confirm('Clear all favorites?')){ favorites = []; persistFavs(); updateFavsUI(); }
  });

  // remove from favs via list (delegation)
  favListEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const title = btn.getAttribute('data-title'); const author = btn.getAttribute('data-author');
    favorites = favorites.filter(f => !(f.title === title && f.author === author));
    persistFavs(); updateFavsUI();
  });

  // theme toggle
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const pressed = document.body.classList.contains('dark');
    themeToggle.setAttribute('aria-pressed', pressed);
  });

  // keyboard: Esc closes modal & favs
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){ closeModal(); closeFavs(); }
  });

  // hook up simple search box in controls
  searchEl.addEventListener('keydown', (e) => { if(e.key === 'Enter') filterAndSearch(); });
});
