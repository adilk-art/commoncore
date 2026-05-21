const filterBtn = document.getElementById('filterBtn');
const sortBtn = document.getElementById('sortBtn');

const filterPanel = document.getElementById('filterPanel');
const sortPanel = document.getElementById('sortPanel');

const panelsRow = document.getElementById('panelsRow');

const searchInput = document.getElementById('searchInput');


// ─── PANELS ─────────────────────────

function updatePanels() {
  const openCount = [filterPanel, sortPanel]
    .filter(panel => !panel.hidden).length;

  panelsRow.dataset.open = openCount;

  panelsRow.classList.toggle(
    'panels-row--visible',
    openCount > 0
  );
}

function togglePanel(panel, button) {
  const isOpen = !panel.hidden;

  panel.hidden = isOpen;

  button.classList.toggle(
    'trigger-btn--active',
    !isOpen
  );

  button.setAttribute(
    'aria-expanded',
    String(!isOpen)
  );

  updatePanels();
}


// ─── BUTTON EVENTS ──────────────────

filterBtn?.addEventListener('click', () => {
  togglePanel(filterPanel, filterBtn);
});

sortBtn?.addEventListener('click', () => {
  togglePanel(sortPanel, sortBtn);
});


// ─── SORT SUBMIT ────────────────────

document.querySelectorAll('.sort-option').forEach(btn => {
  btn.addEventListener('click', function () {
    document.getElementById('sortInput').value =
      this.dataset.val;

    document.getElementById('sortForm').submit();
  });
});


// ─── CATEGORY AUTO SUBMIT ───────────

document
  .querySelectorAll('#filterPanel input[type="radio"]')
  .forEach(radio => {
    radio.addEventListener('change', function () {
      this.closest('form').submit();
    });
  });


// ─── ESC CLEAR SEARCH ───────────────

searchInput?.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    this.value = '';
  }
});


// ─── MOBILE NAV ─────────────────────

const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');

navToggle?.addEventListener('click', () => {
  mobileNav.classList.toggle('mobile-nav--open');

  navToggle.classList.toggle('hamburger--open');
});


// ─── INIT ───────────────────────────

updatePanels();
const wishlistForms =
  document.querySelectorAll(".wish-form");

wishlistForms.forEach((form) => {

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

      const formData = new FormData(form);

      const productId =
        formData.get("productId");

      const button =
        form.querySelector(".wish-btn");

      const svg =
        button.querySelector("svg");

      const isWishlisted =
        button.classList.contains(
          "wish-btn--active",
        );

      let response;

      if (isWishlisted) {

        response = await axios.delete(
          `/user/wishlist/${productId}`,
          {
            headers: {
              "X-Requested-With":
                "XMLHttpRequest",
            },
          },
        );

        button.classList.remove(
          "wish-btn--active",
        );

        svg.setAttribute("fill", "none");

      } else {

        response = await axios.post(
          "/user/wishlist/add",
          { productId },
          {
            headers: {
              "X-Requested-With":
                "XMLHttpRequest",
            },
          },
        );

        button.classList.add(
          "wish-btn--active",
        );

        svg.setAttribute(
          "fill",
          "currentColor",
        );

      }

      userToast(response.data.message);

    } catch (error) {

      const message =
        error?.response?.data?.message ||
        "Failed to update wishlist";

      userToast(message);

    }

  });

});
/* ─────────────────────────
   CART VARIANT MODAL
───────────────────────── */

const cartModal =
  document.getElementById(
    "cartVariantModal",
  );

const closeCartModalBtn =
  document.getElementById(
    "closeCartVariantModal",
  );

const confirmCartBtn =
  document.getElementById(
    "confirmCartVariant",
  );

const colorList =
  document.getElementById(
    "variantColorList",
  );

const sizeList =
  document.getElementById(
    "variantSizeList",
  );

const previewImage =
  document.getElementById(
    "variantPreviewImage",
  );

const previewPrice =
  document.getElementById(
    "variantPreviewPrice",
  );

const previewName =
  document.getElementById(
    "variantProductName",
  );

const stockText =
  document.getElementById(
    "variantStockText",
  );

const cartError =
  document.getElementById(
    "cartVariantError",
  );

let allVariants = [];

let selectedColor = null;

let selectedVariant = null;


/* OPEN MODAL */

document
  .querySelectorAll(".cart-form")
  .forEach((form) => {

    form.addEventListener(
      "submit",
      async (e) => {

        e.preventDefault();

        try {

          const formData =
            new FormData(form);

          const productId =
            formData.get("productId");

          const response =
            await axios.get(
              `/user/cart/variants/${productId}`,
            );

          allVariants =
            response.data.variants;

          renderColors();

          cartModal.classList.add(
            "active",
          );

          document.body.style.overflow =
            "hidden";

        } catch (error) {

          userToast(
            error?.response?.data?.message ||
            "Failed to load variants",
          );

        }

      },
    );

  });


/* RENDER COLORS */

function renderColors() {

  colorList.innerHTML = "";

  const uniqueColors = [];

  allVariants.forEach((variant) => {

    const exists =
      uniqueColors.find(
        (item) =>
          item.name ===
          variant.color.name,
      );

    if (!exists) {
      uniqueColors.push(
        variant.color,
      );
    }

  });

  uniqueColors.forEach((color) => {

    const button =
      document.createElement(
        "button",
      );

    button.className =
      "variant-color";

    button.type = "button";

    button.style.background =
      color.code;

    button.title =
      color.name;

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".variant-color",
          )
          .forEach((el) =>
            el.classList.remove(
              "active",
            ),
          );

        button.classList.add(
          "active",
        );

        selectedColor =
          color.name;

        renderSizes();

      },
    );

    colorList.appendChild(
      button,
    );

  });

  colorList
    .querySelector(
      ".variant-color",
    )
    ?.click();

}


/* RENDER SIZES */

function renderSizes() {

  sizeList.innerHTML = "";

  const filtered =
    allVariants.filter(
      (variant) =>
        variant.color.name ===
        selectedColor,
    );

  filtered.forEach((variant) => {

    const button =
      document.createElement(
        "button",
      );

    button.className =
      "variant-size";

    button.type = "button";

    button.textContent =
      variant.size;

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".variant-size",
          )
          .forEach((el) =>
            el.classList.remove(
              "active",
            ),
          );

        button.classList.add(
          "active",
        );

        selectedVariant =
          variant;

        updatePreview();

      },
    );

    sizeList.appendChild(
      button,
    );

  });

  sizeList
    .querySelector(
      ".variant-size",
    )
    ?.click();

}


/* UPDATE PREVIEW */

/* UPDATE PREVIEW */
function updatePreview() {

  if (!selectedVariant) return;

  previewImage.src =
    selectedVariant.images?.[0]?.url ||
    "/images/no-image.png";

  previewName.textContent =
    selectedVariant.productId?.name ||
    "Product";

  previewPrice.textContent =
    selectedVariant.price.toLocaleString("en-IN");

  // ── STOCK RULE ──
  const stock = selectedVariant.stock;

  if (stock < 10) {
    stockText.textContent = `${stock} items left in stock`;
    stockText.style.display = "block";
  } else {
    stockText.textContent = "";
    stockText.style.display = "none";
  }
}


/* ADD TO CART */

confirmCartBtn.addEventListener(
  "click",
  async () => {

    try {

      if (!selectedVariant) {

        cartError.textContent =
          "Please select a variant";

        return;

      }

      cartError.textContent = "";

      const response =
        await axios.post(
          "/user/cart/add",
          {
            variantId:
              selectedVariant._id,

            quantity: 1,
          },
        );

      userToast(
        response.data.message,
      );

      closeCartModal();

    } catch (error) {

      cartError.textContent =
        error?.response?.data?.message ||
        "Failed to add to cart";

    }

  },
);


/* CLOSE MODAL */

function closeCartModal() {

  cartModal.classList.remove(
    "active",
  );

  document.body.style.overflow =
    "";

  selectedVariant = null;

  selectedColor = null;

  allVariants = [];

  cartError.textContent = "";

}

closeCartModalBtn.addEventListener(
  "click",
  closeCartModal,
);

cartModal.addEventListener(
  "click",
  (e) => {

    if (e.target === cartModal) {
      closeCartModal();
    }

  },
);

document.addEventListener(
  "keydown",
  (e) => {

    if (
      e.key === "Escape" &&
      cartModal.classList.contains(
        "active",
      )
    ) {
      closeCartModal();
    }

  },
);