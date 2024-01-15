const express= require("express");
const app = express();
const mongoose=require("mongoose")
const admin=require('./route/adminRoute')
const user=require('./route/userRoute')
const path=require('path')
const nocache = require("nocache");


app.use(nocache());
app.use(express.json())
app.use(express.urlencoded({extended : true}))



app.set("view engine","ejs")
app.set('views','views')

app.use(express.static(path.join(__dirname,'public')))
// app.use("/public", express.static(path.join(__dirname, 'public')));

app.use('/',user)
app.use('/',admin)






mongoose.connect('mongodb://127.0.0.1:27017/Week8').then(()=>console.log("Database Connected"))
.catch(()=>console.log("failed to connect"));

app.listen(3000,()=>{
    console.log("server Started");
})


// git remote add origin https://github.com/abhiabhishektr/W8.git
// git branch -M main
// git push -u origin main