/* ============================================================
   TRIBAL DOCTOR — PRODUCT DATA
   Single source of truth for all shop pages.
   ============================================================ */

const PRODUCTS = [
  {
    id: "ashwagandha",
    name: "Ashwagandha Root",
    scientificName: "Withania somnifera",
    price: 399,
    category: "Roots",
    plantPart: "Root",
    origin: "Palamu, Jharkhand",
    image: "images/Amla.jpeg",
    description:
      "Sun-dried Ashwagandha root, hand-sorted and sourced directly from forest-adjacent communities in Jharkhand. Valued in traditional practice for centuries as a grounding, restorative root.",
    traditionalUse:
      "Traditionally used in Ayurvedic households as a restorative tonic, taken with warm milk to support strength, calm and everyday resilience.",
  },
  {
    id: "giloy",
    name: "Giloy",
    scientificName: "Tinospora cordifolia",
    price: 299,
    category: "Stems",
    plantPart: "Stem",
    origin: "Ranchi, Jharkhand",
    image: "images/Giloy.jpeg",
    description:
      "Dried Giloy stem cuttings, harvested seasonally and prepared using traditional drying methods passed down through generations of local herbalists.",
    traditionalUse:
      "Traditionally boiled into a bitter decoction (kadha) and taken during seasonal change to support the body's natural resilience.",
  },
  {
    id: "shatavari",
    name: "Shatavari Root",
    scientificName: "Asparagus racemosus",
    price: 449,
    category: "Roots",
    plantPart: "Root",
    origin: "Dumka, Jharkhand",
    image: "images/Shatavari.jpeg",
    description:
      "Whole, sun-dried Shatavari root bundles sourced from community foragers who follow seasonal, sustainable collection cycles.",
    traditionalUse:
      "Traditionally regarded as a nourishing root, taken as a powder mixed with milk or ghee as part of everyday wellness routines.",
  },
  {
    id: "mahua",
    name: "Mahua Flower",
    scientificName: "Madhuca longifolia",
    price: 249,
    category: "Flowers",
    plantPart: "Flower",
    origin: "Gumla, Jharkhand",
    image: "images/Mahua flower.jpeg",
    description:
      "Dried Mahua flowers, forest-collected during the short seasonal bloom and sun-dried using traditional community methods.",
    traditionalUse:
      "Traditionally used in local recipes and remedies passed down within the community, valued as a forest-sourced seasonal ingredient.",
  },
  {
    id: "neem",
    name: "Neem Leaves",
    scientificName: "Azadirachta indica",
    price: 179,
    category: "Leaves",
    plantPart: "Leaf",
    origin: "Simdega, Jharkhand",
    image: "images/Neem.jpeg",
    description:
      "Shade-dried Neem leaves, hand-picked and cleaned before packing, retaining their characteristic bitter, purifying quality.",
    traditionalUse:
      "Traditionally steeped as a wash or infusion and used within households for everyday cleanliness practices.",
  },
  {
    id: "tulsi",
    name: "Tulsi",
    scientificName: "Ocimum tenuiflorum",
    price: 199,
    category: "Leaves",
    plantPart: "Leaf",
    origin: "Ranchi, Jharkhand",
    image: "images/Tulsi.jpeg",
    description:
      "Hand-harvested Tulsi leaves, dried slowly in shade to preserve their aroma, sourced from small community-tended plots.",
    traditionalUse:
      "Traditionally brewed as a daily tea, valued in households as part of morning wellness rituals for generations.",
  },
  {
    id: "amla",
    name: "Amla",
    scientificName: "Phyllanthus emblica",
    price: 229,
    category: "Fruits",
    plantPart: "Fruit",
    origin: "Palamu, Jharkhand",
    image: "images/Amla.jpeg",
    description:
      "Sun-dried Amla fruit slices, collected during the winter harvest and prepared using traditional slow-drying methods.",
    traditionalUse:
      "Traditionally eaten dried, powdered, or soaked overnight, long valued in households as part of daily wellness routines.",
  },
  {
    id: "haritaki",
    name: "Haritaki",
    scientificName: "Terminalia chebula",
    price: 259,
    category: "Fruits",
    plantPart: "Fruit",
    origin: "Dumka, Jharkhand",
    image: "images/Haritaki.jpeg",
    description:
      "Whole dried Haritaki fruit, sourced from forest trees and sun-dried by community collectors using generations-old methods.",
    traditionalUse:
      "Traditionally taken as a fine powder, often mixed with warm water, and passed down as a household staple across generations.",
  },

  {
    id: "white-musli",
    name: "White Musli",
    scientificName: "Chlorophytum borivilianum",
    price: 499,
    category: "Roots",
    plantPart: "Root",
    origin: "Jharkhand, India",
    image: "images/White Musli.jpeg",
    description:
      "Carefully dried White Musli roots, traditionally valued in Indian herbal practices and sourced from cultivation and forest-adjacent regions.",
    traditionalUse:
      "Traditionally used in Ayurveda and regional herbal practices as a nourishing botanical, often associated with vitality, strength and general wellbeing.",
  },
];

/* ---------- helpers shared across pages ---------- */

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function formatPrice(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

/* ---------- shared cart storage (used on every page) ---------- */

const CART_KEY = "tribalDoctorCart";
const DELIVERY_CHARGE = 50;
const FREE_DELIVERY_THRESHOLD = 999;

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(id, quantity) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id, quantity });
  }
  saveCart(cart);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function getCartSubtotal() {
  return getCart().reduce((sum, item) => {
    const product = getProductById(item.id);
    return product ? sum + product.price * item.quantity : sum;
  }, 0);
}

function getDeliveryCharge(subtotal) {
  if (subtotal === 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

/* keeps the navbar cart badge in sync on every page */
function updateCartCount() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = getCartCount();
  });
}

document.addEventListener("DOMContentLoaded", updateCartCount);
