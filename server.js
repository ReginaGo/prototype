require("dotenv").config();
const express = require('express');
const fs = require('fs');
const mongoose = require("mongoose");
const path = require("path");
const User = require("./models/user");
const blogPost = require("./models/blogPost");
const app = express();
const session = require("express-session");
//middleware?
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");

//middleware of la epress session
app.use(session({
    secret: process.env.SESSION_SECRET, // Use a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// MongoDB connection
const mongoUrl = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.7d4m3.mongodb.net/${process.env.DB}?retryWrites=true&w=majority`;
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("MongoDB connection failed:", error));

//registro de usuario
app.post("/login", async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await User.findOne({ name, password });

        if (user) {
            req.session.username = user.name;  // Store username in session
            res.redirect("/");  // Redirect to home page
        } else {
            res.status(401).render('login', { errorMessage: "Error: User or Password incorrect" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Internal server error");
    }
});

// Register route
app.post("/register", async (req, res) => {
    try {
        const { name, password } = req.body;
        const existingUser = await User.findOne({ name });

        if (existingUser) {
            return res.status(400).render('register', { errorMessage: "Error: User already exists" });
        }

        const newUser = new User({ name, password });
        await newUser.save();
        req.session.username = newUser.name;  // Store username in session
        res.redirect("/");  // Redirect to home page
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send("Internal server error");
    }
});




// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).send("An error occurred while logging out.");
        }
        res.redirect("/login"); // Redirect to login page after logout
    });
});
 
//el cagadero del blog 
app.get("/blog", async (req, res) => {
    try {
        if (!req.session.username) {
            return res.redirect("/login");
        }
        const posts = await blogPost.find().sort({ createdAt: -1 });
        res.render("blog", { username: req.session.username, posts: posts });
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        res.status(500).send("Internal server error");
    }
});

// New route for creating a blog post
app.post("/create-post", async (req, res) => {
    try {
        if (!req.session.username) {
            console.error("Unauthorized access attempt to create post.");
            return res.status(401).send("Unauthorized");
        }

        const { title, description } = req.body;

        // Check if title and description are defined
        if (!title || !description) {
            console.error("Missing title or description");
            return res.status(400).send("Title and description are required.");
        }

        const newPost = new blogPost({
            username: req.session.username,
            title,
            description
        });

        await newPost.save();
        res.redirect("/blog");

    } catch (error) {
        console.error("Error creating blog post:", error);  // Check server logs for this output
        res.status(500).send("Internal server error");
    }
});



app.get("/", (req, res) => {
    const username = req.session.username;
    if (!username) {
        return res.redirect("/login"); // Redirect to login if not logged in
    }
    res.render("home", { username }); // Pass username to the template
});

app.get('/conditions', (req, res) => {
    fs.readFile('Data/MH-conditions.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).render('error', { message: 'Error reading data' });
        }
        const conditions = JSON.parse(data);
        res.render('conditions', { conditions: conditions });
    });
});

app.get('/condition/:id', (req, res) => {
    const conditionId = req.params.id;
    fs.readFile('Data/MH-conditions.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).render('error', { message: 'Error reading data' });
        }
        const conditions = JSON.parse(data);
        const condition = conditions.find(c => c.id === conditionId);
        if (!condition) {
            return res.status(404).render('error', { message: 'Condition not found' });
        }
        res.render('condition', { condition: condition });
    });
});


//borrar despues del test
app.get('/mental-health', (req, res) => {
    fs.readFile('/home/user/MH-conditions.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error reading data' });
        }
        res.json(JSON.parse(data));
    });
});

app.get("/register", (req, res) => {
    res.render("register",{errorMessage: null});
});

app.get("/login", (req, res) => {
    res.render("login", {errorMessage: null});
});

app.get("/mood", (req, res) => {
    res.render("mood");
});

// Start the server
app.listen(3000, () => {
    console.log('PP team Rafa listening on port 3000');
});