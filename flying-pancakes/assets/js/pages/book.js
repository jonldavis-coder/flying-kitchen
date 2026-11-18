export async function init() {
  const preview = new URLSearchParams(location.search).get("preview");
  if (preview === "print") {
    document.body.classList.add("is-print-preview");
    document.body.dataset.print = "full";
  }
  const button = document.getElementById("print-book");
  if (!button) return;
  button.addEventListener("click", () => {
    document.body.dataset.print = "full";
    window.print();
  });
}
