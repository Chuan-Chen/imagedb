const express = require('express');
const dotenv = require('dotenv');
const app = express();
const mongoose = require('mongoose')
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require("gridfs-stream")
dotenv.config();
let gfs;
const connection = (async ()=>{
    try{
        console.log("connecting...")
        const params = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: "images"
        }
        await mongoose.connect(process.env.MONGO_URI, params)
        console.log("connected to db")
    }catch(err){
        console.log(err, "connection not established");
    }
})()

const conn = mongoose.connection;

conn.once('open', ()=> {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("images");
})

const storage = new GridFsStorage({
    url: process.env.MONGO_URI,
    options: {useNewUrlParser: true, useUnifiedTopology: true},
    file: (req, file) => {
        const filename = `${Date.now()}-${file.originalname}`
        return {
            bucketName: "image",
            filename: filename
        }
    }
})

const upload = multer({storage})


app.post("/file/upload", upload.single('image'), (req, res) => {
    console.log(req.file);
    if(req.file === undefined){
        res.json({msg: "attach an image file!"});
    }
    const filename = `http://localhost:3000/${req.file.filename}`
    return res.json({result: filename, msg: "image uploaded successfully"})
})

app.get("/file/:filename", async (req, res) => {
    try{
        const file = await gfs.files.findOne({filename: req.params.filename});
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    }catch(err){
         
    }
});




app.listen(process.env.PORT, ()=>{
    console.log(`listening on http://localhost:${process.env.PORT}`)
})
