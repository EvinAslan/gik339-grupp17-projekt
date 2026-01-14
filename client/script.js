// Adressen till API:et där recepten lagras
const API_URL = "http://localhost:3000/recipes";
// Skriver i konsolen att scriptet har laddats
console.log("script.js laddat OK");

//hämtar formuläret från HTML
const form = document.getElementById("recipe-form");
console.log("FORM HITTAD?", form);
// Hämtar rubriken i formuläret och det dolda id-fältet
const formTitle = document.getElementById("form-title");
const idField = document.getElementById("resource-id");

//Hämtar alla inputfält i formuläret
const namnInput = document.getElementById("namn");
const kategoriInput = document.getElementById("kategori");
const tidInput = document.getElementById("tid_minuter");
const svarSelect = document.getElementById("svarighetsgrad");

//Hämtar knappen som rensar formuläret
const clearBtn = document.getElementById("clear-form-btn");

//Hämtar området där recepten ska visas
const mount = document.getElementById("recipe-list-mount");
const emptyState = document.getElementById("empty-state");
const countBadge = document.getElementById("recipe-count");

// Hämtar HTML mallen för ett recept i listan
const template = document.getElementById("recipe-item-template");


// Variabel som sparar Bootstrap modalen
let feedbackModal;
// Funktion som visar ett meddelande i en popup
function showModal(title, message) {

  // Hämtar modalens olika delar från HTML
  const modalEl = document.getElementById("feedback-modal");
  const titleEl = document.getElementById("feedback-modal-title");
  const bodyEl  = document.getElementById("feedback-modal-body");
  
  // Sätter texten i modalen 
  titleEl.textContent = title;
  bodyEl.textContent = message;

  // Skapar modalen om den inte redan finns 
  if (!feedbackModal) {
    feedbackModal = new bootstrap.Modal(modalEl);
  }
  // Visar modalen
  feedbackModal.show();
};

// Återställer formuläret till nytt recept
function resetForm() {
 idField.value = "";   // Ta bort valt id 
 formTitle.textContent = "Lägg till nytt recept:";  // byter tillbaka rubrik
 form.reset();   // Tömmer alla fält 
 svarSelect.value = "Lätt"; // Sätter standarvärde 
}

// Hämtar all data som har vi skrivit i formuläret
function getFormData() {
    return {
     namn: namnInput.value.trim(),  // Receptets namn 
     kategori: kategoriInput.value.trim(), // Receptes kategori 
     tid_minuter: tidInput.value === "" ? null : Number(tidInput.value),  // om ingen tid är angiven sätts värdet till null , annars görs det om till ett tal
     svarighetsgrad: svarSelect.value // vald svårighetsgrad
    };
    
}


// Visar recepten i listan på sidan 

function renderRecipes(recipes) {
    mount.innerHTML = ""; //Tömmer listan först 
    // om listan är töm eller inte är en array 
    if (!Array.isArray(recipes) || recipes.length === 0) {
         mount.appendChild(emptyState); // Visar inga recept
         countBadge.textContent = "0 st"; // Uppdaterar antal 
         return; // Avslutar funktionen 
    };

    // Skapar en container för listan
    const list = document.createElement("div");
    list.className = "list-group";
     
    // Går igenom alla recept 
    recipes.forEach((r) => {
     const clone = template.content.cloneNode(true);
    
     // Sätter receptets namn
     clone.querySelector(".recipe-name").textContent = r.namn;
   
     
     // Fixar tiden (om tid saknas visas ?)
     const tidText = (r.tid_minuter === null || r.tid_minuter === undefined) ? "?" : r.tid_minuter;

     // Sätter text med kategori, tid och svårighetsgrad
     clone.querySelector(".recipe-meta").textContent =
       
     `${r.kategori || "Ingen kategori"} • ${tidText} min • ${r.svarighetsgrad || "?"}`;

     // Hämtar list item och sparar id dataset
     const item = clone.querySelector(".list-group-item");
     item.dataset.id = r.id;
     // Tra bort gamla svårighets klasser och lägger till rätt
     item.classList.remove("difficulty-easy", "difficulty-medium", "difficulty-hard");
     if (r.svarighetsgrad === "Lätt") item.classList.add("difficulty-easy");
     else if (r.svarighetsgrad === "Medel") item.classList.add("difficulty-medium");
     else if (r.svarighetsgrad === "Svår") item.classList.add("difficulty-hard");

      
   
     // När man klickar på Ändra: fyller foruläret med receptets data
     clone.querySelector(".recipe-edit").addEventListener("click", () => {
        idField.value = r.id; // Sparar id så vi vet att det är en uppdaterin
        namnInput.value = r.namn || "";
        kategoriInput.value = r.kategori || "";
        tidInput.value = (r.tid_minuter === null || r.tid_minuter === undefined) ? "" : r.tid_minuter;
        svarSelect.value = r.svarighetsgrad || "Lätt";
        formTitle.textContent = "Ändra recept:";
        window.scrollTo({ top: 0, behavior: "smooth" }); // Scrollar upp till formuläret
     });
    
     //När man klickar på Ta bort : tar bort receptet från API 
     clone.querySelector(".recipe-delete").addEventListener("click", async () => {
          const ok = confirm(`Ta bort "${r.namn}"?`); // Frågar om man är säker
          if (!ok) return;

          try {
            const res = await fetch(`${API_URL}/${r.id}`, { method: "DELETE" }); // DELETE request
            const data = await res.json().catch(() => ({}));
            
            //Om servern svarar med fel
            if (!res.ok) throw new Error(data.error || "kunde inte ta bort receptet");

            console.log("NU SKA MODAL VISA: borttagen");
            // Visar modal och laddar om listan
            showModal("Borttagen", data.message || "Receptet togs bort.");
            await fetchAndRender();
          } catch (err) {
            showModal("Fel", err.message); // Visar fel meddelande 
          }
    
        });
        // Lägger in receptet i listan 
        list.appendChild(clone);
    });
    //Lägger listan på sidan och uppdaterar antal
 mount.appendChild(list);
 countBadge.textContent = `${recipes.length} st`;
}
  

 // Hämtar recept från API och visar dem på sidan 
async function fetchAndRender() {
    try {
        const res = await fetch(API_URL); // Hämtar recept
        const data = await res.json();  // Gör om till json 

        // om något gick fel från servern
        if (!res.ok) throw new Error(data.error || "Kunde inte hämta recept");
        renderRecipes(data); // Visar recepten
    } catch (err) {
        // Visar felruta om hämtningen misslyckas
        mount.innerHTML = `<div class="alert alert-danger mb-0">${err.message}</div>`;
        countBadge.textContent = "0 st";
    }
}


// Submit: POST eller Put
// När man  klickar på spara i formuläret

form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Stoppar sidan från att laddas om

    const payload = getFormData(); // Hämtar alla data från formuläret
    // Om inget namn är ifyllt visas ett fel
    if (!payload.namn) {
        showModal("Fel", "Du måste skriva ett namn på receptet.");
        return;
    }

    const id = idField.value; // Hämtar id om vi ändrar ett recept 


    try {
        // Om id finns , uppdatrea recept (put)
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
            resetForm(); // Tömmer formuläret
            await fetchAndRender(); // Laddar om listan
        }   // Om inget id finns , skapa nyyt recept (POST)
            else {
            const res = await fetch(API_URL, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(payload) 
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Kunde inte skapa receptet");

            console.log("NU SKA MODAL VISA: sparad");
            showModal("skapad", "Receptet sparades.");
            resetForm(); // Tömmer formuläret
            await fetchAndRender();  // Ldda om listan 

        }
    } catch (err) {
        // Visar fel om något går fel
        showModal("Fel", err.message);
    }
});

// När man klickar på rensa knappen 
clearBtn.addEventListener("click", resetForm);

//Start: hämta recepten direkt när sidan laddas
fetchAndRender();

