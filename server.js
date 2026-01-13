
const cors = require("cors");
const express = require("express"); //importerar Express ramverket för att bygga servern.

const sqlite3 = require("sqlite3").verbose();//importerar sqlite3 paketet för att kunna prarta med darabasen och verbose() ger oss mer detaljerande felmedelanden.

const app = express();//skapar en instans av en Express applikation och "app" är nu vår server.

app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
}));
const port = 3000; //detta väljer vilken port servern ska lyssna på och 3000 är en vanlig port för utveckling.

app.use(express.json());
app.use(express.static("public"));

//Detta skapar en anslutning till en databasfil som heter recipes.db.
const db = new sqlite3.Database("./recipes.db", (err) => {
    if (err){
        console.error(err.message); // om nogåt går fel vid anslutningen logga felet.
    }
    console.log("Ansluten till den lokala SQLite databasen: recipes.db");// här loggar ett medelande för att bekräfta att anslutningen lyckades.
});


const createTableSql = `
   CREATE TABLE IF NOT EXISTS recipes (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     namn TEXT NOT NULL,
     kategori TEXT,
     tid_minuter INTEGER,
     svarighetsgrad TEXT
    );

`;

//detta db.run() används för kommandon som inte returnerar data.
db.run(createTableSql, (err) => {
    if (err){
        console.error("Fel vid skapande av tabell:", err.message);
    }
    console.log("Tabellen recipes är redo.");
});

db.all("PRAGMA table_info(recipes)", (err, columns) => {
  if (err) return console.log(err.message);

  const hasSvar = columns.some(c => c.name === "svarighetsgrad");
  if (!hasSvar) {
    db.run("ALTER TABLE recipes ADD COLUMN svarighetsgrad TEXT", (err2) => {
      if (err2) console.log(err2.message);
      else console.log("Kolumnen svarighetsgrad lades till.");
    });
  }
});

app.get("/recipes", (req,res) => {
    const sql = "SELECT * FROM recipes"; //detta är sql fråga för att hämta allt från tabellen

    db.all(sql,[], (err,rows) => {
        if (err) {
            res.status(500).json({ error: err.message});
            return;
        }
        res.json(rows);
    });
});



// skapar ett nytt recept (POST/recipes)
app.post("/recipes", (req,res) => {
    const {namn, kategori, tid_minuter, svarighetsgrad} = req.body;
    const sql = "INSERT INTO recipes (namn, kategori, tid_minuter, svarighetsgrad) VALUES (?, ?, ?, ?)";
    db.run(sql, [namn, kategori, tid_minuter, svarighetsgrad], function(err) {
        if (err) {
            res.status(500).json({ error: err.message});
            return;
        }
        res.status(201).json({ id: this.lastID});
    });

});



//uppdaterar ett befintligt recept
app.put("/recipes", (req,res) => {
    const { id, namn, kategori, tid_minuter, svarighetsgrad} = req.body;
    const sql =`UPDATE recipes SET namn = ?, kategori = ?, tid_minuter = ?, svarighetsgrad = ? WHERE id = ?`;
    db.run(sql,[namn, kategori, tid_minuter, svarighetsgrad, id], function(err){
        if (err) {
            res.status(500).json({ error:err.message});
            return;
        }
        res.json({ message: "Recept uppdaterat"});

    });
});


// den tar bort  ett befintligt recept
app.delete("/recipes/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM recipes WHERE id = ?";
    db.run(sql, id, function (err) {
        if (err) {
            res.status(500).json({error: err.message});
            return;
        }
        res.json({ message: "Recept raderat"});

    });

});

//detta talar om för servern att börja lyssna efter förfrågningar på den port vi definerade.
app.listen(port, () =>{
    console.log(`Servern är startad och lyssnar nu på http://localhost:${port}`);

});







