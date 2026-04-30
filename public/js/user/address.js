const editAddressForm = document.getElementById("addressForm");

let deleteId = "";

function openDeleteModal(id) {
  deleteId = id;
  document.getElementById("deleteModal").style.display = "block";
}

function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none";
  deleteId = "";
}

async function confirmDelete() {
  if (deleteId) {
    try {
      const res = await axios.delete(`/user/address/delete/${deleteId}`);
      window.location.href = "/user/address";
    } catch (err) {
      alert("error deleting address");
    }
  }
}
async function setDefault(addressId) {
  try {
    const res = await axios.patch(`/user/address/default/${addressId}`);
    window.location.href = "/user/address";
  } catch (err) {
    alert("Error setting default");
  }
}

function showAddressForm() {
  document.getElementById("emptyAddAddressCard").style.display = "none";
  document.getElementById("addAddressCard").style.display = "block";
}
function showAddressForm1() {
  document.getElementById("addAddressCard").style.display = "block";
}

function hideAddressForm() {
  document.getElementById("addAddressCard").style.display = "none";
  document.getElementById("emptyAddAddressCard").style.display = "flex";
}

document.addEventListener("DOMContentLoaded", () => {
  const btn1 = document.getElementById("addAddressBtn");
  const btn2 = document.getElementById("addAddressBtnEmpty");
  const cancelBtn = document.getElementById("cancelAddressBtn");

  if (btn1) btn1.addEventListener("click", showAddressForm1);
  if (btn2) btn2.addEventListener("click", showAddressForm);
  if (cancelBtn) cancelBtn.addEventListener("click", hideAddressForm);
});
