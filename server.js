const express=require('express');
const app=express();
const favicon = require('serve-favicon');
let port=8000;
app.listen(port,()=>
{
    console.log("your server is ruuning");

});
app.use(express.json()); 
const cors=require('cors');
app.use(cors());
const path=require('path');

app.set('view engine','ejs');
app.set("views",path.join(__dirname,"views"))
app.get('/',(req,res)=>
{
 res.render("home");

});
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.get('/register',(req,res)=>
{
    res.render('register');
})
app.get('/login',(req,res)=>
{
    res.render('login');
})
app.get('/main',(req,res)=>
{
    res.render('main');
})
const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Akhila',
  database: 'agriadvanz',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL Connection Error:', err);
  } else {
    console.log('MySQL Connected Successfully');
    connection.release();
  }
});


app.post('/register', (req, res) => {
  const { farmername, phonenumber, password, land, income, investment } = req.body;
  console.log(req.body);

  const query = `INSERT INTO farmer (farmername, phonenumber, password, land, income, investment)
                 VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(query, [farmername, phonenumber, password, land, income, investment], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        
        return res.send("<script>alert('Phone number already exists!'); window.location.href='http://localhost:8000/register';</script>");
      }
      console.error('DB Error:', err);
      return res.status(500).send(err.sqlMessage);

    }
    return res.send("<script>alert('Registration successful!'); window.location.href='http://localhost:8000/main';</script>");
  });
});

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = 'your_jwt_secret'; 

app.post('/login', (req, res) => {
  const { phonenumber, password } = req.body;
  const query=`SELECT farmername,password FROM farmer WHERE phonenumber = ? AND password = ?`

  db.query(query, [phonenumber, password],  (err, results) => {
    if (err) 
        {
            console.log(err);
            return res.status(500).json({ error: 'Database error' });
            
        }

    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = results[0];

   
    const match = bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign({ id: user.id, phonenumber: user.phonenumber }, secret, { expiresIn: '1h' });
    res.json({ token });
    
  });
});
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token required' });

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}
app.post('/logout', (req, res) => {
    return res.status(200).json({ message: 'Logged out successfully. Remove token on client.' });
});
app.post('/deactivate', authenticateToken, (req, res) => {
    const phonenumber = req.user.phonenumber;  // Extracted from JWT

    const query = "UPDATE farmer SET is_active = 0 WHERE phonenumber = ?";
    db.query(query, [phonenumber], (err, result) => {
        if (err) {
            console.error("Error deactivating account:", err);
            return res.status(500).json({ error: "Failed to deactivate account" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No active account found with this phone number" });
        }

        return res.status(200).json({ message: "Account deactivated successfully" });
    });
});


app.get('/api/farmers/phonenumber', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM farmers WHERE id = ?", [phonenumber]);
    if (rows.length === 0) return res.status(404).json({ error: "Farmer not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch farmer" });
  }
});

// Update farmer
app.put('/api/farmers/:phonenumber', async (req, res) => {
  const { id } = req.params;
  const { farmername, phonenumber, password, land, income, investment } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE farmer SET farmername = ?, phonenumber = ?, password = ?, land = ?, income = ?, investment = ? WHERE id = ?",
      [farmername, phonenumber, password, land, income, investment, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Farmer not found." });
    }
    res.json({ message: "Farmer updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update farmer" });
  }
});