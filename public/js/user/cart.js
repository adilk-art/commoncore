document.querySelectorAll(".qty-change").forEach(btn => {

  btn.addEventListener("click", async () => {

    const itemId = btn.dataset.id;
    const action = btn.dataset.action;

    try {

      const res = await fetch("/user/cart/quantity", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          action,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        const errorBox = document.getElementById(`qty-error-${itemId}`);
        errorBox.textContent = data.message;
        return;
      }

      location.reload();

    } catch {
      location.reload();
    }

  });

});


document.querySelectorAll(".remove-item").forEach(btn => {

  btn.addEventListener("click", async () => {

    const itemId = btn.dataset.id;

    await fetch(`/user/cart/item/${itemId}`, {
      method: "DELETE",
    });

    location.reload();

  });

});