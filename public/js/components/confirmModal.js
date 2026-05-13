const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmBtn = document.getElementById("confirmBtn");
let callback=null;
 const openConfirmModal = (message, cb) => {
  confirmMessage.textContent = message;
  callback=cb
  confirmModal.classList.add("show");
};

 const closeConfirmModal = () => {
  confirmModal.classList.remove("show");
  callback=null
};
confirmBtn.addEventListener("click",()=>{

  if(callback) callback();
  closeConfirmModal();
}) 

