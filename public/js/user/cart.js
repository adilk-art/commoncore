document
  .querySelectorAll(".qty-change")
  .forEach((btn) => {

    btn.addEventListener(
      "click",
      async () => {

        const itemId =
          btn.dataset.id;

        const action =
          btn.dataset.action;

        try {

          const {
            data,
          } = await axios.patch(
            "/user/cart/quantity",
            {
              itemId,
              action,
            },
          );

          if (!data.success) {

            const errorBox =
              document.getElementById(
                `qty-error-${itemId}`,
              );

            if (errorBox) {

              errorBox.textContent =
                data.message;

            }

            userToast(
              data.message,
            );

            return;

          }

          userToast(
            data.message ||
            "Cart updated",
          );

          setTimeout(() => {
            location.reload();
          }, 300);

        } catch (error) {

          const message =
            error.response?.data
              ?.message ||
            "Something went wrong";

          const errorBox =
            document.getElementById(
              `qty-error-${itemId}`,
            );

          if (errorBox) {

            errorBox.textContent =
              message;

          }

          userToast(
            message,
          );

        }

      },
    );

  });

document
  .querySelectorAll(
    ".remove-item",
  )
  .forEach((btn) => {

    btn.addEventListener(
      "click",
      async () => {

        const itemId =
          btn.dataset.id;

        try {

          const {
            data,
          } = await axios.delete(
            `/user/cart/item/${itemId}`,
          );

          userToast(
            data.message ||
            "Item removed",
          );

          setTimeout(() => {
            location.reload();
          }, 300);

        } catch (error) {

          userToast(
            error.response?.data
              ?.message ||
            "Failed to remove item",
          );

        }

      },
    );

  });

  document
  .querySelectorAll(".move-wishlist")
  .forEach((btn) => {

    btn.addEventListener(
      "click",
      async () => {

        const productId =
          btn.dataset.id;

        try {

          // add product to wishlist
          const { data } =
            await axios.post(
              "/user/wishlist/add",
              {
                productId,
              },
            );

          if (!data.success) {

            userToast(
              data.message ||
              "Failed to move item",
            );

            return;

          }

          // OPTIONAL:
          // remove from cart after adding to wishlist

          const cartItem =
            btn.closest(".cart-item");

          const removeBtn =
            cartItem.querySelector(
              ".remove-item",
            );

          const itemId =
            removeBtn.dataset.id;

          await axios.delete(
            `/user/cart/item/${itemId}`,
          );

          userToast(
            "Moved to wishlist",
          );

          setTimeout(() => {
            location.reload();
          }, 300);

        } catch (error) {

          userToast(
            error.response?.data
              ?.message ||
            "Something went wrong",
          );

        }

      },
    );

  });