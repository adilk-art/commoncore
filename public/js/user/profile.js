const copyReferralBtn = document.getElementById("copyReferralBtn");

copyReferralBtn?.addEventListener("click", async () => {
  const code = copyReferralBtn.dataset.code;

  if (!code) {
    return;
  }

  try {
    await navigator.clipboard.writeText(code);

    const originalHtml = copyReferralBtn.innerHTML;

    copyReferralBtn.innerHTML = `
        <i class="fa-solid fa-check"></i>
        <span>Copied</span>
      `;

    setTimeout(() => {
      copyReferralBtn.innerHTML = originalHtml;
    }, 1500);
  } catch (error) {
    userToast("Unable to copy referral code");
  }
});
