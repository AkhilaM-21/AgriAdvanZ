const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const favicon = require('serve-favicon');
require('dotenv').config();

const port = 8000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD, 
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


app.get('/', (req, res) => {
  res.render('home');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/main', (req, res) => {
  res.render('main');
});

app.post('/register', async (req, res) => {
  const { farmername, phonenumber, password, land, income, investment } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO farmer (farmername, phonenumber, password, land, income, investment, is_active)
                   VALUES (?, ?, ?, ?, ?, ?, 1)`;

    db.query(query, [farmername, phonenumber, hashedPassword, land, income, investment], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.send("<script>alert('Phone number already exists!'); window.location.href='/register';</script>");
        }
        return res.status(500).send(err.sqlMessage);
      } 
      return res.send("<script>alert('Registration successful!'); window.location.href='/login';</script>");
    });
  } catch (error) {
    return res.status(500).send("Error during registration");
  }
});


app.post('/login', (req, res) => {
  const { phonenumber, password } = req.body;

  const query = `SELECT * FROM farmer WHERE phonenumber = ?`;

  db.query(query, [phonenumber], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign(
      { phonenumber: user.phonenumber },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      name: user.farmername,
    });
  });
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });

    req.user = user;
    next();
  });
}
app.get('/api/farmers/:id', (req, res) => {
  const { id } = req.params;

  const query = "SELECT id, farmername, phonenumber, land, income, investment FROM farmer WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length === 0) {
      return res.status(404).json({ error: "Farmer not found" });
    }

    res.status(200).json(results[0]);
  });
});

app.post('/deactivate', authenticateToken, (req, res) => {
  const phonenumber = req.user.phonenumber;

  const checkQuery = "SELECT is_active FROM farmer WHERE phonenumber = ?";
  db.query(checkQuery, [phonenumber], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const isActive = results[0].is_active;

    if (isActive === 1) {
      const updateQuery = "UPDATE farmer SET is_active = 0 WHERE phonenumber = ?";
      db.query(updateQuery, [phonenumber], (err) => {
        if (err)
            {
                return res.status(500).json({ error: "Failed to deactivate account" });
            }
             else {
      const deleteQuery = "DELETE FROM farmer WHERE phonenumber = ?";
      db.query(deleteQuery, [phonenumber], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete account" });

        return res.status(200).json({ message: "Account permanently deleted" });
      });
    }
      });
    }
  });
});


app.post('/logout', (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully. Remove token on client.' });
});


app.put('/api/farmers/:id', (req, res) => {
  const { id } = req.params;
  const { farmername, phonenumber, password, land, income, investment } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: "Error hashing password" });

    const query = `
      UPDATE farmer SET 
        farmername = ?, 
        phonenumber = ?, 
        password = ?, 
        land = ?, 
        income = ?, 
        investment = ?
      WHERE id = ?
    `;

    db.query(query, [farmername, phonenumber, hashedPassword, land, income, investment, id], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to update record" });

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Farmer not found" });
      }

      res.status(200).json({ message: "Farmer record updated successfully" });
    });
  });
});



