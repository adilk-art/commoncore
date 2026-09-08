const changePickupBtn = document.getElementById("changePickupBtn");

const pickupSelector = document.getElementById("pickupSelector");

const pickupModal = document.getElementById("pickupAddressModal");

const openPickupModal = document.getElementById("openPickupAddressModal");

const closePickupModal = document.getElementById("closePickupAddressModal");

const closePickupModalSecondary = document.getElementById(
  "closePickupAddressModalSecondary",
);

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

const cancelReturnNote = document.getElementById("cancelReturnNote");

const retRequestReason = document.getElementById("retRequestReason");

let temporaryPickupAddress = null;
let pendingReturnPayload = null;

changePickupBtn?.addEventListener("click", () => {
  pickupSelector?.classList.toggle("collapsed");
});

function bindPickupCards() {
  const pickupCards = document.querySelectorAll(".checkout-address");

  pickupCards.forEach((card) => {
    card.onclick = () => {
      document.querySelectorAll(".checkout-address").forEach((currentCard) => {
        currentCard.classList.remove("active");

        const radio = currentCard.querySelector(".pickup-address-radio");

        if (radio) {
          radio.checked = false;
        }
      });

      card.classList.add("active");

      const radio = card.querySelector(".pickup-address-radio");

      if (radio) {
        radio.checked = true;
      }

      pickupSelector?.classList.add("collapsed");
    };
  });
}

bindPickupCards();

function showPickupError(id, message) {
  const element = document.getElementById(id);

  if (!element) return;

  element.textContent = message;
  element.style.display = "block";
}

function clearPickupErrors() {
  document
    .querySelectorAll("#pickupAddressModal .error-msg")
    .forEach((element) => {
      element.textContent = "";
      element.style.display = "none";
    });
}

function openPickupAddressDialog() {
  pickupForm?.reset();

  clearPickupErrors();

  pickupModal?.classList.add("active");
}

function closePickupAddressDialog() {
  pickupModal?.classList.remove("active");

  pickupForm?.reset();

  clearPickupErrors();
}

openPickupModal?.addEventListener("click", openPickupAddressDialog);

closePickupModal?.addEventListener("click", closePickupAddressDialog);

closePickupModalSecondary?.addEventListener("click", closePickupAddressDialog);

pickupModal?.addEventListener("click", (event) => {
  if (event.target === pickupModal) {
    closePickupAddressDialog();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && pickupModal?.classList.contains("active")) {
    closePickupAddressDialog();
  }
});
pickupForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  clearPickupErrors();

  let valid = true;

  const fullName = pickupForm.fullName.value.trim();
  const phone = pickupForm.phone.value.trim();
  const line1 = pickupForm.line1.value.trim();
  const line2 = pickupForm.line2.value.trim();
  const city = pickupForm.city.value.trim();
  const state = pickupForm.state.value.trim();
  const pincode = pickupForm.pincode.value.trim();

  const nameRegex =
    /^[A-Za-z]+(?:[.'-]?[A-Za-z]+)*(?:\s+[A-Za-z]+(?:[.'-]?[A-Za-z]+)*)*$/;

  const locationRegex =
    /^[A-Za-z]+(?:[.'-]?[A-Za-z]+)*(?:\s+[A-Za-z]+(?:[.'-]?[A-Za-z]+)*)*$/;

  const phoneRegex = /^[6-9]\d{9}$/;
  const pincodeRegex = /^[1-9]\d{5}$/;
  const addressRegex = /[A-Za-z0-9]/;

  if (fullName.length < 3) {
    showPickupError(
      "pickupFullNameError",
      "Name must be at least 3 characters"
    );
    valid = false;
  } else if (fullName.length > 50) {
    showPickupError(
      "pickupFullNameError",
      "Name cannot exceed 50 characters"
    );
    valid = false;
  } else if (!nameRegex.test(fullName)) {
    showPickupError(
      "pickupFullNameError",
      "Enter a valid name using letters and spaces only"
    );
    valid = false;
  }

  if (!phoneRegex.test(phone)) {
    showPickupError(
      "pickupPhoneError",
      "Enter a valid 10-digit Indian mobile number"
    );
    valid = false;
  }

  if (line1.length < 5) {
    showPickupError(
      "pickupLine1Error",
      "Address must be at least 5 characters"
    );
    valid = false;
  } else if (line1.length > 150) {
    showPickupError(
      "pickupLine1Error",
      "Address cannot exceed 150 characters"
    );
    valid = false;
  } else if (!addressRegex.test(line1)) {
    showPickupError(
      "pickupLine1Error",
      "Enter a valid address"
    );
    valid = false;
  }

  if (line2.length > 100) {
    showPickupError(
      "pickupLine2Error",
      "Landmark cannot exceed 100 characters"
    );
    valid = false;
  } else if (line2 !== "" && !addressRegex.test(line2)) {
    showPickupError(
      "pickupLine2Error",
      "Enter a valid landmark"
    );
    valid = false;
  }

  if (city.length < 2) {
    showPickupError(
      "pickupCityError",
      "City must be at least 2 characters"
    );
    valid = false;
  } else if (city.length > 50) {
    showPickupError(
      "pickupCityError",
      "City cannot exceed 50 characters"
    );
    valid = false;
  } else if (!locationRegex.test(city)) {
    showPickupError(
      "pickupCityError",
      "Enter a valid city name"
    );
    valid = false;
  }

  if (state.length < 2) {
    showPickupError(
      "pickupStateError",
      "State must be at least 2 characters"
    );
    valid = false;
  } else if (state.length > 50) {
    showPickupError(
      "pickupStateError",
      "State cannot exceed 50 characters"
    );
    valid = false;
  } else if (!locationRegex.test(state)) {
    showPickupError(
      "pickupStateError",
      "Enter a valid state name"
    );
    valid = false;
  }

  if (!pincodeRegex.test(pincode)) {
    showPickupError(
      "pickupPincodeError",
      "Enter a valid 6-digit pincode"
    );
    valid = false;
  }

  if (!valid) return;

  temporaryPickupAddress = {
    fullName,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
  };

  const existingTemp = document.getElementById("temporaryPickupCard");

  existingTemp?.remove();

  document.querySelectorAll(".checkout-address").forEach((card) => {
    card.classList.remove("active");

    const radio = card.querySelector(".pickup-address-radio");

    if (radio) {
      radio.checked = false;
    }
  });

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

    <span class="address-badge">
      Temporary Pickup
    </span>

    <h3 class="address-name">
      ${fullName}
    </h3>

    <div class="address-body">
      <p class="address-text">
        ${line1}
      </p>

      ${
        line2
          ? `
            <p class="address-text">
              ${line2}
            </p>
          `
          : ""
      }

      <p class="address-text">
        ${city}, ${state}
      </p>

      <p class="address-text">
        ${pincode}
      </p>
    </div>

    <p class="address-phone">
      +91 ${phone}
    </p>
  `;

  pickupSelector?.prepend(tempCard);

  pickupTypeInput.value = "new";
  pickupAddressIdInput.value = "";
  pickupAddressDataInput.value = JSON.stringify(
    temporaryPickupAddress
  );

  bindPickupCards();

  pickupSelector?.classList.add("collapsed");

  closePickupAddressDialog();

  userToast("Pickup address selected.");
});
function getPickupAddressFromCard(activeCard) {
  const radio = activeCard.querySelector(".pickup-address-radio");

  if (radio?.value === "temporary" && temporaryPickupAddress) {
    pickupTypeInput.value = "new";

    pickupAddressIdInput.value = "";

    pickupAddressDataInput.value = JSON.stringify(temporaryPickupAddress);

    return {
      ...temporaryPickupAddress,
    };
  }

  const addressTexts = activeCard.querySelectorAll(".address-text");

  const name =
    activeCard.querySelector(".address-name")?.textContent.trim() || "";

  const phone =
    activeCard
      .querySelector(".address-phone")
      ?.textContent.replace("+91", "")
      .trim() || "";

  const line1 = addressTexts[0]?.textContent.trim() || "";

  let line2 = "";
  let cityStateIndex = 1;
  let pincodeIndex = 2;

  if (addressTexts.length >= 4) {
    line2 = addressTexts[1]?.textContent.trim() || "";

    cityStateIndex = 2;
    pincodeIndex = 3;
  }

  const cityState = addressTexts[cityStateIndex]?.textContent.trim() || "";

  const pincode = addressTexts[pincodeIndex]?.textContent.trim() || "";

  const [city = "", state = ""] = cityState.split(",");

  if (radio?.value === "delivery") {
    pickupTypeInput.value = "delivery";

    pickupAddressIdInput.value = "";

    pickupAddressDataInput.value = "";
  } else {
    pickupTypeInput.value = "other";

    pickupAddressIdInput.value = radio?.value || "";

    pickupAddressDataInput.value = "";
  }

  return {
    fullName: name,
    phone,
    line1,
    line2,
    city: city.trim(),
    state: state.trim(),
    pincode,
  };
}

function buildReturnPayload() {
  const reason = document.getElementById("returnReason")?.value;

  if (!reason) {
    userToast("Please select a reason.");

    return null;
  }

  const activeCard = document.querySelector(".checkout-address.active");

  if (!activeCard) {
    userToast("Please select a pickup address.");

    return null;
  }

  const pickupAddress = getPickupAddressFromCard(activeCard);

  if (
    !pickupAddress.fullName ||
    !pickupAddress.phone ||
    !pickupAddress.line1 ||
    !pickupAddress.city ||
    !pickupAddress.state ||
    !pickupAddress.pincode
  ) {
    userToast("Pickup address is incomplete.");

    return null;
  }

  return {
    orderId: requestReturnBtn.dataset.orderId,

    itemId: requestReturnBtn.dataset.itemId,

    reason,

    comments: document.getElementById("returnComments")?.value.trim() || "",

    pickupAddress,
  };
}

requestReturnBtn?.addEventListener("click", () => {
  const payload = buildReturnPayload();

  if (!payload) return;

  pendingReturnPayload = payload;

  if (retRequestReason) {
    retRequestReason.textContent = `Reason: ${pendingReturnPayload.reason}`;
  }

  confirmReturnModal?.classList.remove("hidden");
});

function closeReturnConfirmModal() {
  confirmReturnModal?.classList.add("hidden");
}

closeConfirmReturnModal?.addEventListener("click", closeReturnConfirmModal);

keepReturnRequestBtn?.addEventListener("click", closeReturnConfirmModal);

confirmReturnModal?.addEventListener("click", (event) => {
  if (event.target === confirmReturnModal) {
    closeReturnConfirmModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    confirmReturnModal &&
    !confirmReturnModal.classList.contains("hidden")
  ) {
    closeReturnConfirmModal();
  }
});

confirmReturnRequestBtn?.addEventListener("click", async () => {
  if (!pendingReturnPayload) {
    return;
  }

  try {
    confirmReturnRequestBtn.disabled = true;

    confirmReturnRequestBtn.textContent = "Submitting...";

    const response = await axios.post(
      "/user/returns/request",
      pendingReturnPayload,
    );

    const returnRequest = response.data.returnRequest;

    closeReturnConfirmModal();

    const orderId = pendingReturnPayload.orderId;

    const itemId = pendingReturnPayload.itemId;

    const returnNumber = returnRequest.returnNumber;

    if (cancelReturnNote) {
      cancelReturnNote.textContent = `Your return has been submitted with Return ID "${returnNumber}"`;
    }

    if (viewReturnDetailsBtn) {
      viewReturnDetailsBtn.href = `/user/returns/${orderId}/${itemId}`;
    }

    returnSuccessModal?.classList.remove("hidden");

    pendingReturnPayload = null;
  } catch (error) {
    userToast(error?.response?.data?.message || "Something went wrong.");
  } finally {
    confirmReturnRequestBtn.disabled = false;

    confirmReturnRequestBtn.textContent = "Confirm Return Request";
  }
});
