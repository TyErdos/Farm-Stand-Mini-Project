const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override')
require('dotenv').config();
const session = require('express-session');
const MongoDBStore = require("connect-mongo");

const Product = require('./models/product');

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
// 'mongodb://127.0.0.1:27017/farmStand'
const dbUrl = process.env.DB_URL;
mongoose.connect(dbUrl,     
{
        useNewUrlParser: true,
        // useCreateIndex: true,                      NOT REQUIRED IN NEWER VERSION OF MONGOOSE
        useUnifiedTopology: true
})
.then(() =>
{
    console.log('Mongo Connection Open.');
})
.catch(err =>
{    
    console.log("Oh no, a mongo error occurred");
    console.log(err);
})


const store = MongoDBStore.create({
    mongoUrl: dbUrl,
    secret: '4Wf!2^eoR9L7',
    touchAfter: 24 * 60 * 60
});

store.on("error", function(e){
    console.log("Session Store Error", e)
})

const sessionConfig = {

    store,
    name: 'products',
    secret: "4Wf!2^eoR9L7",
    resave: false,
    saveUninitialized: true,
    cookie: {
        name: 'products',
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //1000 milliseconds in a second, 60 secs in a minute, 60 mins in an hour, 24 hours in a day and 7 days in a week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }

}

app.use(session(sessionConfig));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine',  'ejs');

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));


const categories = ['fruit', 'vegetable', 'dairy'];

app.get('/',  (req, res) => 
{

    res.render('home');

})
app.get('/products', async (req, res) => 
{
    const {category} = req.query;
    if(category)
    {
        const products = await Product.find({category});
        res.render('products/index', {products, category});
    }
    else
    {
        const products = await Product.find({});
        res.render('products/index', {products, category: 'All'});
    }
    
   
})


//MASSIVE ERROR WITH THIS ROUTE RESOLVED
// EXPLANATION: had to have the /new route above the :id route. "when you hit the /products/new route, it is like hitting /products/:id route with new as id"
app.get('/products/new',  (req, res) => 
{

    res.render('products/new', {categories});

})



app.post('/products', async (req, res) =>
{
    const newProduct = new Product(req.body)
    await newProduct.save();
    res.redirect(  `/products/${newProduct._id}`)
})



app.get('/products/:id', async (req, res) => 
{
    const {id} = req.params;
    const product = await Product.findById(id);
    res.render('products/details', {product});

})

app.get('/products/:id/edit', async (req, res) => 
{
    const {id} = req.params;
    const product = await Product.findById(id);
    res.render('products/edit', {product, categories});
})

app.put('/products/:id', async (req, res) => 
{
    const {id} = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, {runValidators: true, new:true})
    res.redirect(`/products/${product._id}`)
})

app.delete('/products/:id', async (req, res) => 
{
    const {id} = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    res.redirect('/products');
})


app.listen('3000', () =>
{
    console.log("App listening on port 3000");

})

