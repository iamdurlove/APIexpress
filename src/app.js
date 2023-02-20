require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const Register = require('./models/employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');

require('./db/conn');
const port = process.env.PORT;

//using path to render public folder for static web
const static_path = path.join(__dirname, '../public');
app.use(express.static(static_path));

//using handlebars engine to render 
const template_path = path.join(__dirname, '../templates/views');
const partials_path = path.join(__dirname, '../templates/partials');
app.set('view engine', 'hbs');
app.set('views', template_path);
hbs.registerPartials(partials_path)


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.get('/', (req, res) => {
    res.render('index');
});

app.get('/secret', auth, (req, res) => {
    // console.log(`awesome token: ${req.cookies.jwt}`);
    res.render('secret');
});

// signing out for one device
app.get('/logout', auth, async (req, res) => {
    try {
        res.clearCookie('jwt');
        // console.log('log out suceess');

        // to delete token from database // single logout
        req.user.tokens = req.user.tokens.filter((currElement) => {
            return currElement.token !== req.token;
        });

        // whole logout
        req.user.tokens = [];


        await req.user.save();
        res.render('login');
    } catch (e) {
        res.status(500).send(e);
    }
});

// signing out for whole device
app.get('/logoutAll', auth, async (req, res) => {
    try {
        res.clearCookie('jwt');

        // whole logout
        req.user.tokens = [];

        await req.user.save();
        res.render('login');
    } catch (e) {
        res.status(500).send(e);
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

//hashing
// const securePassword = async (password) => {
//     try {
//         const passwordData = await bcrypt.hash(password, 10);
//         console.log(passwordData);
//     } catch (e) {
//         console.log(e);
//     }
// }


// Creating POST request to create a new user
app.post('/register', async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.cpassword;

        if (password === cpassword) {
            const registerEmployee = new Register({
                fname: req.body.fname,
                lname: req.body.lname,
                email: req.body.email,
                gender: req.body.gender,
                phone: req.body.phone,
                age: req.body.age,
                password: req.body.password
            });

            const token = await registerEmployee.generateAuthToken();

            //generating cookies
            res.cookie('jwt', token, {
                expires: new Date(Date.now() + 30000),
                httpOnly: true
            });

            const registerd = await registerEmployee.save();
            res.status(201).render('index');

        } else {
            res.send("Password don't match");
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/records', (req, res) => {
    res.render('records');
});


app.get('/login', async (req, res) => {
    res.render('login');
});


// Creating POST request to check login
app.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const check = await Register.findOne({ email: email });

        const isMatch = await bcrypt.compare(password, check.password);
        const token = await check.generateAuthToken();
        // console.log(`token is ${token}`);

        //generating cookies
        res.cookie('jwt', token, {
            expires: new Date(Date.now() + 600000),
            httpOnly: true,
            // secure: true
        });

        if (isMatch) {
            res.render('dashboard');
        }
        else {
            res.redirect('/login');
            console.log('Invalid username or password');
        }

    } catch (err) {
        res.redirect('/login');
        console.log('Invalid username or password');
    }
});


// JSON WEB TOKEN
// const async = createToken = async () => {
//     const token = await jwt.sign({ _id: '4545454' }, 'jhfasjhfjsdhfjhdasjfjsdafhjkdhfjdhfjsdahfjksdhf');
//     console.log(token);

//     const userVer = await jwt.verify(token, "jhfasjhfjsdhfjhdasjfjsdafhjkdhfjdhfjsdahfjksdhf");
//     console.log(userVer);

// };

// createToken();

app.listen(port, () => {
    console.log(`listening on port no ${port}`);
});