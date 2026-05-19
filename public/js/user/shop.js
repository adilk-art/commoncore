const filterBtn = document.getElementById('filterBtn');
const sortBtn = document.getElementById('sortBtn');

const filterPanel = document.getElementById('filterPanel');
const sortPanel = document.getElementById('sortPanel');

const panelsRow = document.getElementById('panelsRow');

const searchInput = document.getElementById('searchInput');


// ─── PANELS ─────────────────────────

function updatePanels() {
  const openCount = [filterPanel, sortPanel]
    .filter(panel => !panel.hidden).length;

  panelsRow.dataset.open = openCount;

  panelsRow.classList.toggle(
    'panels-row--visible',
    openCount > 0
  );
}

function togglePanel(panel, button) {
  const isOpen = !panel.hidden;

  panel.hidden = isOpen;

  button.classList.toggle(
    'trigger-btn--active',
    !isOpen
  );

  button.setAttribute(
    'aria-expanded',
    String(!isOpen)
  );

  updatePanels();
}


// ─── BUTTON EVENTS ──────────────────

filterBtn?.addEventListener('click', () => {
  togglePanel(filterPanel, filterBtn);
});

sortBtn?.addEventListener('click', () => {
  togglePanel(sortPanel, sortBtn);
});


// ─── SORT SUBMIT ────────────────────

document.querySelectorAll('.sort-option').forEach(btn => {
  btn.addEventListener('click', function () {
    document.getElementById('sortInput').value =
      this.dataset.val;

    document.getElementById('sortForm').submit();
  });
});


// ─── CATEGORY AUTO SUBMIT ───────────

document
  .querySelectorAll('#filterPanel input[type="radio"]')
  .forEach(radio => {
    radio.addEventListener('change', function () {
      this.closest('form').submit();
    });
  });


// ─── ESC CLEAR SEARCH ───────────────

searchInput?.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    this.value = '';
  }
});


// ─── MOBILE NAV ─────────────────────

const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');

navToggle?.addEventListener('click', () => {
  mobileNav.classList.toggle('mobile-nav--open');

  navToggle.classList.toggle('hamburger--open');
});


// ─── INIT ───────────────────────────

updatePanels();