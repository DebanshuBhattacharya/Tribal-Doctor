/* ============================================================
   TRIBAL DOCTOR — CART PAGE
   ============================================================ */

(function () {
  const cartRoot = document.getElementById("cartRoot");

  function renderEmpty() {
    cartRoot.innerHTML = `
      <div class="empty-state">
        <h2>Your cart is empty</h2>
        <p>Browse our botanicals and add something you'd like to try.</p>
        <a href="shop.html" class="btn btn-primary"><span>Continue Shopping</span></a>
      </div>
    `;
  }

  function itemTemplate(item, product) {
    const lineTotal = product.price * item.quantity;
    return `
      <div class="cart-item" data-id="${product.id}">
        <a href="product.html?id=${product.id}" class="cart-item-media">
          <img src="${product.image}" alt="${product.name}" />
        </a>
        <div class="cart-item-info">
          <a href="product.html?id=${product.id}"><h4>${product.name}</h4></a>
          <p class="cart-item-price">${formatPrice(product.price)} each</p>
          <button type="button" class="cart-item-remove" data-remove="${product.id}">Remove</button>
        </div>
        <div class="cart-item-qty">
          <button type="button" data-decrease="${product.id}" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-increase="${product.id}" aria-label="Increase quantity">+</button>
        </div>
        <div class="cart-item-total">${formatPrice(lineTotal)}</div>
      </div>
    `;
  }

  function render() {
    const cart = getCart();

    if (cart.length === 0) {
      renderEmpty();
      return;
    }

    const validItems = cart
      .map((item) => ({ item, product: getProductById(item.id) }))
      .filter((entry) => entry.product);

    if (validItems.length === 0) {
      renderEmpty();
      return;
    }

    const subtotal = getCartSubtotal();
    const delivery = getDeliveryCharge(subtotal);
    const total = subtotal + delivery;
    const remainingForFree = 999 - subtotal;

    cartRoot.innerHTML = `
      <div class="cart-layout">
        <div class="cart-items">
          ${validItems.map(({ item, product }) => itemTemplate(item, product)).join("")}
        </div>
        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="cart-summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
          <div class="cart-summary-row"><span>Delivery</span><span>${delivery === 0 ? "Free" : formatPrice(delivery)}</span></div>
          <div class="cart-summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
          ${
            remainingForFree > 0
              ? `<p class="free-delivery-note">Add ${formatPrice(remainingForFree)} more for free delivery.</p>`
              : `<p class="free-delivery-note">You've unlocked free delivery.</p>`
          }
          <a href="checkout.html" class="btn btn-primary btn-block"><span>Proceed to Checkout</span></a>
        </div>
      </div>
    `;

    bindItemEvents();
  }

  function bindItemEvents() {
    cartRoot.querySelectorAll("[data-increase]").forEach((btn) => {
      btn.addEventListener("click", () => changeQuantity(btn.dataset.increase, 1));
    });
    cartRoot.querySelectorAll("[data-decrease]").forEach((btn) => {
      btn.addEventListener("click", () => changeQuantity(btn.dataset.decrease, -1));
    });
    cartRoot.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => removeItem(btn.dataset.remove));
    });
  }

  function changeQuantity(id, delta) {
    const cart = getCart();
    const entry = cart.find((i) => i.id === id);
    if (!entry) return;
    entry.quantity += delta;
    if (entry.quantity <= 0) {
      saveCart(cart.filter((i) => i.id !== id));
    } else {
      saveCart(cart);
    }
    render();
  }

  function removeItem(id) {
    const cart = getCart().filter((i) => i.id !== id);
    saveCart(cart);
    render();
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

  render();
})();
