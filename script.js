const API_URL = "http://localhost:3000/recipes";
console.log("script.js laddat OK");

const form = document.getElementById("recipe-form");
console.log("FORM HITTAD?", form);
const formTitle = document.getElementById("form-title");
const idField = document.grtElementById("resource-id");

const namnInput = document.getElementById("namn");
const kategoriInput = document.getElemnetById("kategori");
const tidInput = document.getElemnetById("tid_minuter");
const svarSelect = document.getElemnetById("svarighetsgrad"); //test

const clearBtn = document.getElemnetById("clear-form-btn");

const mount = document.getElemnetById("recipe-list-mount");
const emptyState = document.getElemnetById("empty-state");
const countBadge = document.getElemnetById("recipe-count");
const template = document.getElemnetById("recipe-item-template");

const modalTitle = document.getElemnetById("feedback-modal-title");
const modalBody = document.getElemnetById("feedback-modal-body");

//...................
function showModal(title, message) {
    console.log("showModal körs:", title, message);

    const modalEl = document.getElemnetById("feedback-modal");
    const titleEl = document.getElemnetById("feedback-modal-title");
    const bodyEl = document.getElemnetById("feedback-modal-body");

    if (!modalEl  || !titleEl || !bodyEl) {
     console.error("Modal-element saknas!", { modalEl, titleEl, bodyEl });
     alert(title + ": " + message);
     return;
    } 
    titleEl.textContent = title;
    bodyEl.textContent = message;

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

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
        tid_minuter: tidInput.Value === "" ? null : Number(tidInput.value),
        savrighetsgrad: svarSelect.value
    };
    
}

//.........................

// Render (lista)
function renderRecipes(recipes){
    mount.innerHTML = "";

    if(!Array.isArray(recipes) || recipes.length === 0){
        //visa tomt-läge igen
        mount.appendChild(emptyState);
        countBadge.textContent = "0 st";
        return;
    }
    const list = document.createElement("div");
    list.className = "list-group";

    recipes.forEach((r) => {
     const clone = template.content.cloneNode(true);

     clone.querySelector(".recipe-name").textContent = r.namn;
   

     const tidtext = (r.tid_minuter === null || r.tid_minuter === undefined) ? "?" : r.tid.minuter;
     clone.querySelector(".recipe-meta").textContent =
       
     `${r.karegori || "Ingen kartegori"} • ${tidText} min • ${r.svarighetsgrad || "?"}`;
     const item = clone.querySelector(".list-group-item");
     item.dataset.id = r.id;

     // ändra
     clone .querySelector(".recipe = -edit").addEvent("click", () =>{
        idField.value = r.id;
        namnInput.value = r.namn || "";
        kategoriInput.value = r.kartegori || "";
        tidInput.value = (r.tid_minuter === null || r.tid_minuter === undefined) ? "" : r.tid_minuter;
        svarSelect.value = r.svarighetsgrad || "Lätt";
        formTitle.textContent = "Ändra recept:";
        window.scrollTo({top: 0, behavior: "smooth" });
     });

     //Ta bort
     clone.querySelector(".recipe-delete").addEventListener("click", async () =>{
          const ok = confim(` ta bort "${r.namn}"?`);
          if(!ok) return;

          try{
            const res = await fetch(`${API_URL}/${r.id}`,{ method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            
            if (!res.ok) throw new Error(data.error || "kunde inte ta bort receptet" );

            console.log("Nu ska modal visa: borttagen");
            showModal("Borttagen", data.message || "Recetet togs bort.");
            await fetchAndRender();
          }catch (err) {
            showModal("Fel", err.message);
          }
    
        });
        list.appenChid(clone);
    });
 mount.appendChid(list);
 countBadge.textContent = `${recipes.length} st`;
}


 //--------------------
async function fetchAndRender() {
    try{
        const res = await fetch(API_URL);
        const  data = await res.json();

        if (!res.ok) throw new Error (data.error || " Kunde inte hämta recept");
        renderRecipes(data);
    } catch (err) {
        mount.innerHTML = `<div class="alert alert-danger mb-0">${err.message}</div>`;
        countBadge.textContent = "0 st";
    }
}
//---------------
// Submit: POST eller Put

form.addEventListener("submit", async (e) => {
    console.log("SUBMIT TRIGGAS ");
    e.preventDefault();

    const payload = getFormData();
    if (!payload.namn) {
        showModal("Fel", " Du måsta skriva ett namn på receptet.");
        return;
    }

    const id = idField.value;

    try {
        //------------
        if(id) {
            const res = await fetch(API_URL, {
                method: "PUT",
                headers: {"Content-Type": "application/json" },
                body: JSON.stringify({ id: Number(id), ...payload })
            });
            const dat = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Kunde inte uppdatera receptet");

            console.log("NU SKA MODAL VISA: uppaterad");
            showModal("Uppdaterad" , data.message || "Receptet uppdaterades. ");
            resetForm();
            await fetchAndRender();
        }   else{
            const res = await fetch(API_URL,{
               method: "POST",
               headers: { "Content-type": "application/json" },
               body: JSON.stringify(payload) 
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Kunde inte skapa receptet");

            console.log("NU SKA MODAL VISA: sparad");
            showModal("skapad", "Receptet sparades.");
            resetForm();
            await fetchAndRender();

        }
    }catch (err){
        showModal("Fel", err.message);
    }
});

// rensa knapp
clearBtn.addEventListener("click", resetForm);

//Start: hämta listen när sidan laddas
fetchAndRender();
console.log({form, formTitle, idField, namnInput, mount, modalBody });
 
