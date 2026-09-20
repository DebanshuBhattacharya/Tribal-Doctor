/* ============================================================
   TRIBAL DOCTOR — PRODUCT PAGE
   ============================================================ */

(function () {
  const root = document.getElementById("productRoot");
  const breadcrumbName = document.getElementById("breadcrumbName");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const product = id ? getProductById(id) : null;

  let quantity = 1;

  function renderNotFound() {
    root.innerHTML = `
      <div class="not-found">
        <h2>Product not found</h2>
        <p>The product you're looking for doesn't exist or may have been removed.</p>
        <a href="shop.html" class="btn btn-primary"><span>Back to Shop</span></a>
      </div>
    `;
  }

  function renderProduct() {
    breadcrumbName.textContent = product.name;
    document.title = product.name + " — Tribal Doctor";

    root.innerHTML = `
      <div class="product-detail">
        <div class="product-media-col" data-reveal>
          <img src="${product.image}" alt="${product.name}" />
        </div>
        <div class="product-info-col" data-reveal>
          <h1>${product.name}</h1>
          <p class="product-scientific">${product.scientificName}</p>

          <div class="product-price-row">
            <span class="product-price">${formatPrice(product.price)}</span>
          </div>

          <div class="product-facts">
            <div class="product-fact"><span>Plant part</span><span>${product.plantPart}</span></div>
            <div class="product-fact"><span>Origin</span><span>${product.origin}</span></div>
            <div class="product-fact"><span>Category</span><span>${product.category}</span></div>
          </div>

          <p class="product-desc">${product.description}</p>

          <div class="product-knowledge">
            <h4>Traditional use</h4>
            <p>${product.traditionalUse}</p>
          </div>

          <div class="product-actions">
            <div class="qty-selector">
              <button type="button" id="qtyMinus" aria-label="Decrease quantity">−</button>
              <span id="qtyValue">1</span>
              <button type="button" id="qtyPlus" aria-label="Increase quantity">+</button>
            </div>
            <div class="product-buttons">
              <button type="button" id="buyItBtn" class="btn btn-primary"><span>Buy It</span></button>
              <a href="make.html?id=${product.id}" class="btn btn-outline"><span>Make It</span></a>
            </div>
          </div>

          <p class="added-toast" id="addedToast">Added to cart.</p>
        </div>
      </div>
    `;

    bindActions();
    revealIn();
  }

  function bindActions() {
    const qtyValue = document.getElementById("qtyValue");
    const minusBtn = document.getElementById("qtyMinus");
    const plusBtn = document.getElementById("qtyPlus");
    const buyBtn = document.getElementById("buyItBtn");
    const toast = document.getElementById("addedToast");

    minusBtn.addEventListener("click", () => {
      if (quantity > 1) {
        quantity -= 1;
        qtyValue.textContent = quantity;
      }
    });

    plusBtn.addEventListener("click", () => {
      quantity += 1;
      qtyValue.textContent = quantity;
    });

    buyBtn.addEventListener("click", () => {
      addToCart(product.id, quantity);
      toast.classList.add("show");
      clearTimeout(buyBtn._toastTimer);
      buyBtn._toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
    });
  }

  function revealIn() {
    if (window.gsap) {
      gsap.fromTo(
        root.querySelectorAll("[data-reveal]"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
      );
    }
  }

  /* mobile menu */
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", mobileMenu.classList.contains("open"));
    });
  }

  if (product) {
    renderProduct();
  } else {
    renderNotFound();
  }
})();
