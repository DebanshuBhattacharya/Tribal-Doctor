/* ============================================================
   TRIBAL DOCTOR — CHECKOUT PAGE
   ============================================================ */

const ORDER_KEY = "tribalDoctorOrder";

(function () {
  const checkoutRoot = document.getElementById("checkoutRoot");

  function renderEmpty() {
    checkoutRoot.innerHTML = `
      <div class="empty-state">
        <h2>Your cart is empty</h2>
        <p>Add a few products before checking out.</p>
        <a href="shop.html" class="btn btn-primary"><span>Continue Shopping</span></a>
      </div>
    `;
  }

  function render() {
    const cart = getCart();
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

    checkoutRoot.innerHTML = `
      <form class="checkout-layout" id="checkoutForm" novalidate>
        <div class="checkout-details">

          <div class="checkout-section">
            <h3>Contact &amp; Delivery Details</h3>
            <div class="form-grid">
              <div class="form-field full">
                <label for="fullName">Full Name</label>
                <input type="text" id="fullName" name="fullName" />
                <span class="field-error" data-error-for="fullName"></span>
              </div>
              <div class="form-field">
                <label for="phone">Phone</label>
                <input type="tel" id="phone" name="phone" />
                <span class="field-error" data-error-for="phone"></span>
              </div>
              <div class="form-field">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" />
                <span class="field-error" data-error-for="email"></span>
              </div>
              <div class="form-field full">
                <label for="address">Address</label>
                <input type="text" id="address" name="address" />
                <span class="field-error" data-error-for="address"></span>
              </div>
              <div class="form-field">
                <label for="city">City</label>
                <input type="text" id="city" name="city" />
                <span class="field-error" data-error-for="city"></span>
              </div>
              <div class="form-field">
                <label for="state">State</label>
                <input type="text" id="state" name="state" />
                <span class="field-error" data-error-for="state"></span>
              </div>
              <div class="form-field">
                <label for="pincode">PIN Code</label>
                <input type="text" id="pincode" name="pincode" inputmode="numeric" />
                <span class="field-error" data-error-for="pincode"></span>
              </div>
            </div>
          </div>

          <div class="checkout-section">
            <h3>Payment</h3>
            <div class="payment-options">
              <label class="payment-option selected">
                <input type="radio" name="payment" value="Cash on Delivery" checked />
                <span>Cash on Delivery</span>
              </label>
              <label class="payment-option">
                <input type="radio" name="payment" value="UPI (Demo)" />
                <span>UPI (Demo)</span>
              </label>
            </div>
          </div>

        </div>

        <div class="checkout-summary">
          <h3>Order Summary</h3>
          ${validItems
            .map(
              ({ item, product }) => `
            <div class="checkout-mini-item">
              <span>${product.name} × ${item.quantity}</span>
              <span>${formatPrice(product.price * item.quantity)}</span>
            </div>`
            )
            .join("")}
          <div class="checkout-divider"></div>
          <div class="checkout-summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
          <div class="checkout-summary-row"><span>Delivery</span><span>${delivery === 0 ? "Free" : formatPrice(delivery)}</span></div>
          <div class="checkout-summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
          <button type="submit" class="btn btn-primary btn-block"><span>Place Order</span></button>
        </div>
      </form>
    `;

    bindForm(validItems, subtotal, delivery, total);
  }

  function bindForm(items, subtotal, delivery, total) {
    const form = document.getElementById("checkoutForm");

    form.querySelectorAll('input[name="payment"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        form.querySelectorAll(".payment-option").forEach((el) => el.classList.remove("selected"));
        radio.closest(".payment-option").classList.add("selected");
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) return;

      const data = Object.fromEntries(new FormData(form).entries());
      const orderId = "TD-" + Date.now().toString().slice(-8);

      const order = {
        orderId,
        name: data.fullName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        payment: data.payment,
        items: items.map(({ item, product }) => ({
          id: product.id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
        })),
        subtotal,
        delivery,
        total,
        placedAt: new Date().toISOString(),
      };

      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
      clearCart();
      window.location.href = "order-success.html";
    });
  }

  function validate(form) {
    const required = ["fullName", "phone", "email", "address", "city", "state", "pincode"];
    let valid = true;

    required.forEach((name) => {
      const input = form.querySelector(`[name="${name}"]`);
      const errorEl = form.querySelector(`[data-error-for="${name}"]`);
      const value = input.value.trim();
      let message = "";

      if (!value) {
        message = "This field is required.";
      } else if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        message = "Enter a valid email address.";
      } else if (name === "phone" && !/^\d{10}$/.test(value.replace(/\D/g, ""))) {
        message = "Enter a valid 10-digit phone number.";
      } else if (name === "pincode" && !/^\d{6}$/.test(value)) {
        message = "Enter a valid 6-digit PIN code.";
      }

      if (message) {
        valid = false;
        input.classList.add("error");
        errorEl.textContent = message;
      } else {
        input.classList.remove("error");
        errorEl.textContent = "";
      }
    });

    return valid;
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
