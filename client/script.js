const API_URL = "http://localhost:3000/recipes";
console.log("script.js laddat OK");

const form = document.getElementById("recipe-form");
console.log("FORM HITTAD?", form);
const formTitle = document.getElementById("form-title");
const idField = document.getElementById("resource-id");

const namnInput = document.getElementById("namn");
const kategoriInput = document.getElementById("kategori");
const tidInput = document.getElementById("tid_minuter");
const svarSelect = document.getElementById("svarighetsgrad"); //test

const clearBtn = document.getElementById("clear-form-btn");

const mount = document.getElementById("recipe-list-mount");
const emptyState = document.getElementById("empty-state");
const countBadge = document.getElementById("recipe-count");
const template = document.getElementById("recipe-item-template");


//...................
let feedbackModal;
function showModal(title, message) {
  
  const modalEl = document.getElementById("feedback-modal");
  const titleEl = document.getElementById("feedback-modal-title");
  const bodyEl  = document.getElementById("feedback-modal-body");
  
  titleEl.textContent = title;
  bodyEl.textContent = message;


  if (!feedbackModal) {
    feedbackModal = new bootstrap.Modal(modalEl);
  }

  feedbackModal.show();
};

function resetForm() {
 idField.value = "";
 formTitle.textContent = "Lägg till nytt recept:";
 form.reset();
 svarSelect.value = "Lätt";
}

function getFormData() {
    return {
     namn: namnInput.value.trim(),
     kategori: kategoriInput.value.trim(),
     tid_minuter: tidInput.value === "" ? null : Number(tidInput.value),
     svarighetsgrad: svarSelect.value
    };
    
}


//.........................

// Render (lista)
function renderRecipes(recipes) {
    mount.innerHTML = "";
    if (!Array.isArray(recipes) || recipes.length === 0) {
         mount.appendChild(emptyState);
         countBadge.textContent = "0 st";
         return;
    };

 
    const list = document.createElement("div");
    list.className = "list-group";

    recipes.forEach((r) => {
     const clone = template.content.cloneNode(true);

     clone.querySelector(".recipe-name").textContent = r.namn;
   

     const tidText = (r.tid_minuter === null || r.tid_minuter === undefined) ? "?" : r.tid_minuter;
     clone.querySelector(".recipe-meta").textContent =
       
     `${r.kategori || "Ingen kategori"} • ${tidText} min • ${r.svarighetsgrad || "?"}`;
     const item = clone.querySelector(".list-group-item");
     item.dataset.id = r.id;
     item.classList.remove("difficulty-easy", "difficulty-medium", "difficulty-hard");
     if (r.svarighetsgrad === "Lätt") item.classList.add("difficulty-easy");
     else if (r.svarighetsgrad === "Medel") item.classList.add("difficulty-medium");
     else if (r.svarighetsgrad === "Svår") item.classList.add("difficulty-hard");

      
   
     // ändra
     clone.querySelector(".recipe-edit").addEventListener("click", () => {
        idField.value = r.id;
        namnInput.value = r.namn || "";
        kategoriInput.value = r.kategori || "";
        tidInput.value = (r.tid_minuter === null || r.tid_minuter === undefined) ? "" : r.tid_minuter;
        svarSelect.value = r.svarighetsgrad || "Lätt";
        formTitle.textContent = "Ändra recept:";
        window.scrollTo({ top: 0, behavior: "smooth" });
     });
    
     //Ta bort
     clone.querySelector(".recipe-delete").addEventListener("click", async () => {
          const ok = confirm(`Ta bort "${r.namn}"?`);
          if (!ok) return;

          try {
            const res = await fetch(`${API_URL}/${r.id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            
            if (!res.ok) throw new Error(data.error || "kunde inte ta bort receptet");

            console.log("NU SKA MODAL VISA: borttagen");
            showModal("Borttagen", data.message || "Receptet togs bort.");
            await fetchAndRender();
          } catch (err) {
            showModal("Fel", err.message);
          }
    
        });
        list.appendChild(clone);
    });
 mount.appendChild(list);
 countBadge.textContent = `${recipes.length} st`;
}
  

 //--------------------
async function fetchAndRender() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Kunde inte hämta recept");
        renderRecipes(data);
    } catch (err) {
        mount.innerHTML = `<div class="alert alert-danger mb-0">${err.message}</div>`;
        countBadge.textContent = "0 st";
    }
}

//---------------
// Submit: POST eller Put

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = getFormData();
    if (!payload.namn) {
        showModal("Fel", "Du måste skriva ett namn på receptet.");
        return;
    }

    const id = idField.value;


    try {
        //------------
        if (id) {
            const res = await fetch(API_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: Number(id), ...payload })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Kunde inte uppdatera receptet");

            console.log("NU SKA MODAL VISA: uppdaterad");
            showModal("Uppdaterad", data.message || "Receptet uppdaterades.");
            resetForm();
            await fetchAndRender();
        }   else {
            const res = await fetch(API_URL, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(payload) 
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Kunde inte skapa receptet");

            console.log("NU SKA MODAL VISA: sparad");
            showModal("skapad", "Receptet sparades.");
            resetForm();
            await fetchAndRender();

        }
    } catch (err) {
        showModal("Fel", err.message);
    }
});

// rensa knapp
clearBtn.addEventListener("click", resetForm);

//Start: hämta listen när sidan laddas
fetchAndRender();

