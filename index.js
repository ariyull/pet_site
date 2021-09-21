// video explaining how this works: https://www.youtube.com/watch?v=wIOpe8S2Mk8

const fs = require('fs')
const express = require("express");
const app = express();
const path = require('path')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const got = require('got');
const { resolve } = require('path');

//~~~~~~~~~~~~~~~ image upload settings ~~~~~~~~~~~~~~~~~~~~~~~~~
const imageDir = 'public/images';
const multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, imageDir)
    },
    filename: (req, file, cb) => {
        console.log("now the last file uploaded is " + Date.now() + '_' + file.originalname);
        cb(null, Date.now() + '_' + file.originalname)
    }
})



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//return name of last file 
const upload = multer({ storage: storage });
const {Client} = require('pg')

function imagesfoldernames() {
    const filenames = fs.readdirSync(imageDir);
    return filenames
}

//~~~~~~~~~~~~~~~~~~~ use ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(express.static("public"));
app.use(express.static("views"));
app.use(express.static("pics"));
app.use("/public/images", express.static(path.join(__dirname, imageDir)));
app.use(express.urlencoded());
app.use(express.json());

app.set("view engine", "ejs");


//~~~~~~~~~~~ connect to postgreSQL database ~~~~~~~~~~~~~~~~~~ 

async function selectfromtable() {
    const client = new Client ({
        host: "localhost",
        user: "postgres",
        port: "5432",
        password: "arielle",
        database: "postgres"
    });
    await client.connect();
    try {
        const res = await client.query(`Select * from buns`);
        const myrows = res.rows;
    
        await client.end();
        return myrows
    } catch(err) {
        console.log(err.message);
    }
}

async function insertBon(buninfo, profilePath) {
    const client = new Client ({
        host: "localhost",
        user: "postgres",
        port: "5432",
        password: "arielle",
        database: "postgres"
    });
    await client.connect();
    try {
        const queryText = 'INSERT INTO buns(name, breed, age, location, fixed, litter_trained, profile_picture_path, description) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
        const values = [buninfo.name, buninfo.breed, buninfo.age, buninfo.location, buninfo.fixed, buninfo.litter, profilePath, buninfo.description];
        const res = await client.query(queryText, values);
        const myrows = res.rows;
        console.log(myrows);
        await client.end();
        return myrows;
    } catch(err) {
        console.log(err.message);
    }
}




//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Main navigation pages ~~~~~~~~~~~~~~~~~~~~~~~~~~
app.get("/", async (req, res) => {

    let myrows = await selectfromtable();
    console.log(myrows);

    const lastRow = myrows[myrows.length - 1];


    // the pet name is the file upload substring from position 14 to stringlength - 4 (omits the date prefix and file type suffix!):
    const petname = lastRow.name;
    const lastPic = "/"+lastRow.profile_picture_path;
    
    console.log( "last file uploaded was " + lastPic);
    console.log("the name of the pet is " + petname);



    // render the page named index and import the ejs variables in {}:
    res.render("index", {lastpic: lastPic, 
                        lastuploadpetname: petname,
                        tableinfo : myrows,
                        });

});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/donate", (req, res) => {
    res.render("donate");
});


// upload page also needs app.post for uploading images 

app.get("/upload", (req, res) => {
    res.render("upload");
});

app.post("/upload", upload.single('image'), (req, res) => { 
    let buninfo = req.body;
    const profilePath = req.file.path;
    insertBon(buninfo, req.file.destination+"/"+req.file.filename);
    res.redirect("/imageuploaded.html");
});

function makeFindName(nameString) {
    return ({name}) => name === nameString
}



//~~~~~~~~~~~~~~~PETS PAGES~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app.get("/buns/:bunName", async (req, res) => {
    let myrows = await selectfromtable();
    let bundata = myrows.find(makeFindName(req.params.bunName));
    res.render("bunpage", {buninfo : bundata});
});

// app.get("/henry", async (req, res) => {
//     let myrows = await selectfromtable();
//     let henrydata = myrows.find(makeFindName('henry'));
//     res.render("henry", {henryinfo : henrydata});
// });

// app.get("/mimimoi", async (req, res) => {
//     let myrows = await selectfromtable();
//     let mimimoidata = myrows.find(( ({ name }) => name === 'mimimoi' ));
//     res.render("mimimoi",  {mimimoiinfo : mimimoidata});
// });

// app.get("/nubbins", async (req, res) => {
//     let myrows = await selectfromtable();
//     let nubbinsdata = myrows.find(( ({ name }) => name === 'nubbins' ));
//     res.render("nubbins",  {nubbinsinfo : nubbinsdata});
// });

// app.get("/baby", async (req, res) => {
//     let myrows = await selectfromtable();
//     let babydata = myrows.find(( ({ name }) => name === 'baby' ));
//     res.render("baby", {babyinfo : babydata});
// });

// app.get("/cosmo", async (req, res) => {
//     let myrows = await selectfromtable();
//     let cosmodata = myrows.find(( ({ name }) => name === 'cosmo' ));
//     res.render("cosmo", {cosmoinfo : cosmodata});
// });



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



app.listen(3001);
console.log("3001 is port");