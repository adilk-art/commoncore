const reportFilter =
  document.getElementById("reportFilter");

const customDateFields =
  document.getElementById("customDateFields");

reportFilter?.addEventListener("change", () => {
  const isCustom =
    reportFilter.value === "custom";

  customDateFields?.classList.toggle(
    "hidden",
    !isCustom,
  );
});