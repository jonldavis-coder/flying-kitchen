import { armForm, readFormMeta } from "../lib/human.js";
import { friendlyError } from "../lib/dom.js";
import { herePath, siteUrl } from "../lib/url.js";

export async function init(adapter) {
  const form = document.getElementById("submit-form");
  if (!form) return;
  const session = await adapter.getSession();
  const note = document.getElementById("submit-auth-note");
  if (!session) {
    if (note) {
      note.hidden = false;
      note.textContent = "Sign in before submitting a dish.";
    }
    const link = document.createElement("a");
    link.href = `login.html?next=${encodeURIComponent(herePath())}`;
    link.textContent = "Sign in";
    note?.append(" ", link);
    form.querySelector("button[type=submit]").disabled = true;
    return;
  }
  armForm(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = form.querySelector(".form-error");
    error.textContent = "";
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    const data = new FormData(form);
    const file = data.get("photo");
    let photoDataUrl = "";
    if (file && file.size) {
      if (!String(file.type || "").startsWith("image/")) {
        error.textContent = "The picture must be an image.";
        button.disabled = false;
        return;
      }
      if (file.size > 700000) {
        error.textContent = "Use a picture under 700 KB.";
        button.disabled = false;
        return;
      }
      photoDataUrl = await readFile(file);
    }
    try {
      const dish = await adapter.submitDish({
        name: data.get("name"),
        country: data.get("country"),
        region: data.get("region"),
        baseType: data.get("baseType"),
        heat: data.get("heat"),
        flavor: data.get("flavor"),
        story: data.get("story"),
        funFact: data.get("funFact"),
        yieldText: data.get("yieldText"),
        servings: Number(data.get("servings")),
        prepMinutes: Number(data.get("prepMinutes")),
        cookMinutes: Number(data.get("cookMinutes")),
        uses: data.getAll("uses"),
        diets: data.getAll("diets"),
        ingredients: String(data.get("ingredients") || "").split("\n"),
        steps: String(data.get("steps") || "").split("\n"),
        photoDataUrl
      }, readFormMeta(form));
      location.href = siteUrl(`dish.html?slug=${encodeURIComponent(dish.slug)}`);
    } catch (err) {
      error.textContent = friendlyError(err);
      button.disabled = false;
    }
  });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that picture."));
    reader.readAsDataURL(file);
  });
}
