const navToggle = document.getElementById("navToggle");
const mobileNav = document.getElementById("mobileNav");

const searchBtn = document.getElementById("headerSearchBtn");
const searchBox = document.getElementById("headerSearch");
const closeSearchBtn = document.getElementById("closeHeaderSearch");

navToggle?.addEventListener("click", () => {
  navToggle.classList.toggle("hamburger--open");
  mobileNav?.classList.toggle("mobile-nav--open");
});

searchBtn?.addEventListener("click", () => {
  searchBox?.classList.toggle("active");

  if (searchBox?.classList.contains("active")) {
    setTimeout(() => {
      searchBox.querySelector("input")?.focus();
    }, 200);
  }
});

closeSearchBtn?.addEventListener("click", () => {
  searchBox?.classList.remove("active");
});
