/* ============================================================
   TRIBAL DOCTOR — SHOP PAGE
   ============================================================ */

(function () {
  const grid = document.getElementById("shopGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortSelect = document.getElementById("sortSelect");

  /* populate category dropdown from data.js */
  function initCategories() {
    const categories = [...new Set(PRODUCTS.map((p) => p.category))];
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  }

  function cardTemplate(product) {
    return `
      <article class="shop-card" data-reveal>
        <a href="product.html?id=${product.id}" class="shop-card-media">
          <img src="${product.image}" alt="${product.name}" loading="lazy" />
        </a>
        <div class="shop-card-body">
          <h3>${product.name}</h3>
          <p class="shop-card-desc">${product.description}</p>
          <div class="shop-card-foot">
            <span class="shop-card-price">${formatPrice(product.price)}</span>
            <a href="product.html?id=${product.id}" class="shop-card-link">View product</a>
          </div>
        </div>
      </article>
    `;
  }

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const sort = sortSelect.value;

    let list = PRODUCTS.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.scientificName.toLowerCase().includes(query);
      const matchesCategory = category === "all" || p.category === category;
      return matchesQuery && matchesCategory;
    });

    if (sort === "low-high") list.sort((a, b) => a.price - b.price);
    if (sort === "high-low") list.sort((a, b) => b.price - a.price);

    if (list.length === 0) {
      grid.innerHTML = `<div class="shop-empty">No products match your search.</div>`;
      return;
    }

    grid.innerHTML = list.map(cardTemplate).join("");
    revealCards();
  }

  function revealCards() {
    const cards = grid.querySelectorAll("[data-reveal]");
    if (window.gsap) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
      );
    }
  }

  /* mobile menu */
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      const isOpen = mobileMenu.classList.contains("open");
      hamburger.setAttribute("aria-expanded", isOpen);
    });
  }

  searchInput.addEventListener("input", render);
  categoryFilter.addEventListener("change", render);
  sortSelect.addEventListener("change", render);

  initCategories();
  render();
})();
