const changePickupBtn = document.getElementById("changePickupBtn");
const pickupSelector = document.getElementById("pickupSelector");

const pickupModal = document.getElementById("pickupAddressModal");
const openPickupModal = document.getElementById("openPickupAddressModal");
const closePickupModal = document.getElementById("closePickupAddressModal");

const pickupForm = document.getElementById("pickupAddressForm");

const requestReturnBtn = document.getElementById("requestReturnBtn");
const pickupAddressDataInput = document.getElementById("pickupAddressData");
const pickupTypeInput = document.getElementById("pickupAddressType");
const pickupAddressIdInput = document.getElementById("pickupAddressId");

const confirmReturnModal = document.getElementById("confirmReturnModal");
const closeConfirmReturnModal = document.getElementById(
  "closeConfirmReturnModal",
);
const keepReturnRequestBtn = document.getElementById("keepReturnRequestBtn");
const confirmReturnRequestBtn = document.getElementById(
  "confirmReturnRequestBtn",
);

const returnSuccessModal = document.getElementById("returnSuccessModal");
const viewReturnDetailsBtn = document.getElementById("viewReturnDetailsBtn");
const cancelReturnNote=document.getElementById("cancelReturnNote");
const retRequestReason=document.getElementById("retRequestReason");
let temporaryPickupAddress = null;
let pendingReturnPayload = null;

changePickupBtn?.addEventListener("click", () => {
  pickupSelector.classList.toggle("collapsed");
});

function bindPickupCards() {
  const pickupCards = document.querySelectorAll(".checkout-address");

  pickupCards.forEach((card) => {
    card.addEventListener("click", () => {
      pickupCards.forEach((c) => {
        c.classList.remove("active");
        const radio = c.querySelector(".pickup-address-radio");
        if (radio) radio.checked = false;
      });

      card.classList.add("active");

      const radio = card.querySelector(".pickup-address-radio");
      if (radio) radio.checked = true;

      pickupSelector.classList.add("collapsed");
    });
  });
}

bindPickupCards();

openPickupModal?.addEventListener("click", () => {
  pickupForm.reset();
  clearPickupErrors();
  pickupModal.classList.add("active");
});

closePickupModal?.addEventListener("click", () => {
  pickupModal.classList.remove("active");
});

function showPickupError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = message;
  el.style.display = "block";
}

function clearPickupErrors() {
  document.querySelectorAll("#pickupAddressModal .error-msg").forEach((el) => {
    el.innerText = "";
    el.style.display = "none";
  });
}

pickupForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  clearPickupErrors();

  let valid = true;

  const fullName = pickupForm.fullName.value.trim();
  const phone = pickupForm.phone.value.trim();
  const line1 = pickupForm.line1.value.trim();
  const line2 = pickupForm.line2.value.trim();
  const city = pickupForm.city.value.trim();
  const state = pickupForm.state.value.trim();
  const pincode = pickupForm.pincode.value.trim();

  if (fullName.length < 3) {
    showPickupError("pickupFullNameError", "Minimum 3 characters required");
    valid = false;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    showPickupError("pickupPhoneError", "Invalid phone number");
    valid = false;
  }

  if (line1.length < 3) {
    showPickupError("pickupLine1Error", "Address is required");
    valid = false;
  }

  if (city.length < 2) {
    showPickupError("pickupCityError", "City is required");
    valid = false;
  }

  if (state.length < 2) {
    showPickupError("pickupStateError", "State is required");
    valid = false;
  }

  if (!/^\d{6}$/.test(pincode)) {
    showPickupError("pickupPincodeError", "Invalid pincode");
    valid = false;
  }

  if (!valid) return;

  const existingTemp = document.getElementById("temporaryPickupCard");
  if (existingTemp) existingTemp.remove();

  const tempCard = document.createElement("label");
  tempCard.className = "checkout-address active";
  tempCard.id = "temporaryPickupCard";

  tempCard.innerHTML = `
    <input
      type="radio"
      name="pickupAddress"
      value="temporary"
      checked
      class="hidden pickup-address-radio"
    >

    <div class="checkout-address-top">
      <span class="address-badge">Temporary Pickup</span>
    </div>

    <h3 class="address-name">${fullName}</h3>
    <p class="address-text">${line1}</p>
    ${line2 ? `<p class="address-text">${line2}</p>` : ""}
    <p class="address-text">${city}, ${state}</p>
    <p class="address-text">${pincode}</p>
    <p class="address-phone">+91 ${phone}</p>
  `;

  document.querySelectorAll(".checkout-address").forEach((card) => {
    card.classList.remove("active");
    const radio = card.querySelector(".pickup-address-radio");
    if (radio) radio.checked = false;
  });

  document.querySelector(".checkout-address-grid").prepend(tempCard);

  pickupSelector.classList.add("collapsed");
  pickupModal.classList.remove("active");

  bindPickupCards();

  userToast("Pickup address selected.");
});

function buildReturnPayload() {
  const reason = document.getElementById("returnReason").value;

  if (!reason) {
    userToast("Please select a reason.");
    return null;
  }

  const activeCard = document.querySelector(".checkout-address.active");
  if (!activeCard) {
    userToast("Please select a pickup address.");
    return null;
  }

  const pickupAddress = {
    fullName: activeCard.querySelector(".address-name")?.textContent.trim(),
    line1: activeCard.querySelectorAll(".address-text")[0]?.textContent.trim(),
    line2: activeCard.querySelectorAll(".address-text")[1]?.textContent.includes(",")
      ? ""
      : activeCard.querySelectorAll(".address-text")[1]?.textContent.trim() || "",
    city: activeCard.querySelectorAll(".address-text")[activeCard.querySelectorAll(".address-text").length - 2]
      ?.textContent.split(",")[0].trim(),
    state: activeCard.querySelectorAll(".address-text")[activeCard.querySelectorAll(".address-text").length - 2]
      ?.textContent.split(",")[1]?.trim(),
    pincode: activeCard.querySelectorAll(".address-text")[activeCard.querySelectorAll(".address-text").length - 1]
      ?.textContent.trim(),
    phone: activeCard.querySelector(".address-phone")?.textContent.replace("+91", "").trim(),
  };

  return {
    orderId: requestReturnBtn.dataset.orderId,
    itemId: requestReturnBtn.dataset.itemId,
    reason,
    comments: document.getElementById("returnComments").value.trim(),
    pickupAddress,
  };
}

requestReturnBtn?.addEventListener("click", () => {
  const payload = buildReturnPayload();

  if (!payload) return;

  pendingReturnPayload = payload;
  const retReason=pendingReturnPayload.reason;
  retRequestReason.textContent=`Reason:${retReason}`;

  confirmReturnModal.classList.remove("hidden");
});

function closeReturnConfirmModal() {
  confirmReturnModal.classList.add("hidden");
}

closeConfirmReturnModal?.addEventListener("click", closeReturnConfirmModal);
keepReturnRequestBtn?.addEventListener("click", closeReturnConfirmModal);

confirmReturnRequestBtn?.addEventListener("click", async () => {
  if (!pendingReturnPayload) return;

  try {
    confirmReturnRequestBtn.disabled = true;
    confirmReturnRequestBtn.textContent = "Submitting...";

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const res=await axios.post("/user/returns/request", pendingReturnPayload);

    closeReturnConfirmModal();

    const orderId = pendingReturnPayload.orderId;
    const itemId = pendingReturnPayload.itemId;
    const returnNumber=res.data.returnRequest.returnNumber;
    cancelReturnNote.textContent=`Your return has been submitted with Return ID "${returnNumber}"`

    viewReturnDetailsBtn.href = `/user/returns/${orderId}/${itemId}`;

    returnSuccessModal.classList.remove("hidden");

    pendingReturnPayload = null;
  } catch (error) {
    userToast(error.response?.data?.message || "Something went wrong.");
  } finally {
    confirmReturnRequestBtn.disabled = false;
    confirmReturnRequestBtn.textContent = "Confirm Return Request";
  }
});
