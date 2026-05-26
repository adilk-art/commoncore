const modal = document.querySelector(".stock-modal");
const variantsContainer = document.querySelector(".variants-container");
const closeModalBtn = document.querySelector(".close-stock-modal");
const manageButtons = document.querySelectorAll(".manage-stock-btn");

manageButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      const productId = button.dataset.id;

      const response = await fetch(`/admin/inventory/${productId}/variants`);

      const data = await response.json();

      if (!response.ok) {
        return utils.showToast(
          "error",
          data.message || "Failed to load variants",
        );
      }

      variantsContainer.innerHTML = data.variants.length
        ? data.variants
            .map((variant) => {
              let stockLevel = "";
              let stockClass = "";

              if (variant.stock === 0) {
                stockLevel = "Out Of Stock";
                stockClass = "stock-out";
              } else if (variant.stock <= 5) {
                stockLevel = "Low Stock";
                stockClass = "stock-low";
              } else {
                stockLevel = "In Stock";
                stockClass = "stock-good";
              }

              return `

              <div class="variant-stock-card">

                <div class="variant-top">

                  <div>

                    <h4>
                      ${variant.color.name} / ${variant.size}
                    </h4>

                    <p>
                      SKU: ${variant.sku}
                    </p>

                  </div>

                  <div class="variant-stock-info">

                    <span class="stock-badge ${stockClass}">
                      ${stockLevel}
                    </span>

                    <span class="current-stock">
                      ${variant.stock} units
                    </span>

                  </div>

                </div>

                <div class="variant-actions">

                  <button
                    class="qty-btn"
                    onclick="decreaseQty('${variant._id}')"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min="0"
                    value="${variant.stock}"
                    class="stock-input"
                    id="qty-${variant._id}"
                  >

                  <button
                    class="qty-btn"
                    onclick="increaseQty('${variant._id}')"
                  >
                    +
                  </button>

                  <button
                    class="stock-btn"
                    onclick="updateStock('${variant._id}')"
                  >
                    Update Stock
                  </button>

                </div>

              </div>

            `;
            })
            .join("")
        : `

          <div class="empty-variants">

            <i class="fa-solid fa-box-open"></i>

            <h3>
              No Variants Found
            </h3>

            <p>
              This product has no variants yet
            </p>

          </div>

        `;

      modal.classList.remove("hidden");
    } catch (error) {
      console.error(error);

      utils.showToast("error", "Failed to load variants");
    }
  });
});

closeModalBtn.addEventListener("click", () => {
  window.location.reload();
  modal.classList.add("hidden");
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

const increaseQty = (variantId) => {
  const input = document.querySelector(`#qty-${variantId}`);

  input.value = Number(input.value || 0) + 1;
};

const decreaseQty = (variantId) => {
  const input = document.querySelector(`#qty-${variantId}`);

  const current = Number(input.value || 0);

  if (current > 0) {
    input.value = current - 1;
  }
};
const updateStock = async (variantId) => {
  const button = event.target;

  const originalText = button.innerHTML;

  try {
    button.disabled = true;

    button.innerHTML = `
      <span class="btn-loader"></span>
      Updating
    `;

    const quantity = document.querySelector(`#qty-${variantId}`).value;

    const response = await fetch(
      `/admin/inventory/variant/${variantId}/stock`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          operation: "set",
          quantity,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      button.disabled = false;
      button.innerHTML = originalText;

      return utils.showToast("error", data.message || "Failed to update stock");
    }

    utils.showToast("Stock updated successfully");

    const currentStock = document.querySelector(`#qty-${variantId}`).value;

    const card = document
      .querySelector(`#qty-${variantId}`)
      .closest(".variant-stock-card");

    card.querySelector(".current-stock").textContent = `${currentStock} units`;

    const badge = card.querySelector(".stock-badge");

    badge.classList.remove("stock-good", "stock-low", "stock-out");

    if (Number(currentStock) === 0) {
      badge.textContent = "Out Of Stock";
      badge.classList.add("stock-out");
    } else if (Number(currentStock) <= 5) {
      badge.textContent = "Low Stock";
      badge.classList.add("stock-low");
    } else {
      badge.textContent = "In Stock";
      badge.classList.add("stock-good");
    }

    button.disabled = false;

    button.innerHTML = originalText;
  } catch (error) {
    console.error(error);

    button.disabled = false;
    button.innerHTML = originalText;

    utils.showToast("error", "Something went wrong");
  }
};
const getStockClass = (stock) => {
  if (stock === 0) return "stock-out";
  if (stock <= 5) return "stock-low";
  return "stock-good";
};

window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.updateStock = updateStock;
