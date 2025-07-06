import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pg from 'pg';
import session from 'express-session';
import pgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

const db = new pg.Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456789@01'
});
await db.connect();

const adminDb = new pg.Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456789@01'
});
await adminDb.connect();

// Creates and configures the admin database tables for storing admin user information
async function setupAdminDatabase() {
  try {
    console.log('🔧 Setting up admin database...');
    
    await adminDb.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await adminDb.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)
    `);
    
    console.log('✅ Admin database setup completed!');
    console.log('📋 Admin database schema:');
    console.log('   - admin_users table created/verified');
    console.log('   - Email index created/verified');
    
  } catch (error) {
    console.error('❌ Error setting up admin database:', error.message);
  }
}

// Creates and configures all main database tables for the e-commerce application
async function setupMainDatabase() {
  try {
    console.log('🔧 Setting up main database...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER,
        quantity INTEGER,
        price INTEGER
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS returns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER,
        quantity INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS IDX_sessions_expire ON sessions(expire);
    `);
    
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_sessions_sid ON sessions(sid);
    `);
    
    console.log('✅ Main database setup completed!');
    console.log('📋 Main database schema:');
    console.log('   - users table created/verified');
    console.log('   - carts table created/verified');
    console.log('   - orders table created/verified');
    console.log('   - order_items table created/verified');
    console.log('   - returns table created/verified');
    console.log('   - sessions table created/verified');
    
  } catch (error) {
    console.error('❌ Error setting up main database:', error.message);
  }
}

await setupMainDatabase();
await setupAdminDatabase();

const pgSession = pgSimple(session);

app.use(session({
  store: new pgSession({
    conObject: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5433,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '123456789@01'
    },
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('=== Google Strategy Processing ===');
      console.log('Profile:', profile.displayName, profile.emails[0].value);
      
      const email = profile.emails[0].value;
      const name = profile.displayName;
      
      let result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      console.log('Database query result:', result.rows.length, 'users found');
      
      if (result.rows.length === 0) {
        console.log('Creating new user...');
        const newUser = await db.query(
          'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
          [name, email, '']
        );
        console.log('New user created:', newUser.rows[0]);
        return done(null, newUser.rows[0]);
      } else {
        console.log('Existing user found:', result.rows[0]);
        return done(null, result.rows[0]);
      }
    } catch (err) {
      console.error('Google Strategy Error:', err);
      return done(err, null);
    }
  }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user with ID:', id);
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      console.log('No user found with ID:', id);
      return done(null, false);
    }
    
    console.log('User deserialized successfully:', result.rows[0]);
    done(null, result.rows[0]);
  } catch (err) {
    console.error('Deserialize error:', err);
    done(err, null);
  }
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  console.log('User registration attempt:', { name, email, password: password ? '***' : 'missing' });
  
  if (!name || !email || !password) {
    console.log('Missing fields for user registration');
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  try {
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Inserting into users database...');
    const result = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );
    
    console.log('User registration successful:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (e) {
    console.error('User registration error:', e);
    if (e.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed: ' + e.message });
    }
  }
});

app.post("/admin/register", async (req, res) => {
  const { name, email, phone, password, confirmPassword, adminCode } = req.body;
  
  console.log("Admin registration attempt:", { name, email, phone, passwordLength: password?.length });
  
  if (!name || !email || !phone || !password || !confirmPassword || !adminCode) {
    console.log("Admin registration failed: Missing required fields");
    return res.status(400).json({ error: "All fields are required." });
  }
  
  if (password !== confirmPassword) {
    console.log("Admin registration failed: Passwords do not match");
    return res.status(400).json({ error: "Passwords do not match." });
  }
  
  if (password.length < 6) {
    console.log("Admin registration failed: Password too short");
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }
  
  // Verify admin code (you can set this in environment variables)
  const validAdminCode = process.env.ADMIN_REGISTRATION_CODE || "ADMIN2025";
  if (adminCode !== validAdminCode) {
    console.log("Admin registration failed: Invalid admin code");
    return res.status(400).json({ error: "Invalid admin registration code." });
  }
  
  try {
    // Check if email already exists in users table
    const existingUser = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (existingUser.rows.length > 0) {
      console.log("Admin registration failed: Email already exists in users table:", email);
      return res.status(400).json({ error: "Email already registered as user. Please use a different email." });
    }
    
    // Check if email already exists in admin_users table
    const existingAdminEmail = await adminDb.query(`SELECT * FROM admin_users WHERE email = $1`, [email]);
    if (existingAdminEmail.rows.length > 0) {
      console.log("Admin registration failed: Email already exists in admin table:", email);
      return res.status(400).json({ error: "Email already registered as admin." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Admin password hashed successfully");

    // Insert into admin database
    const newAdmin = await adminDb.query(
      `INSERT INTO admin_users (name, email, phone, password, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name, email, phone, hashedPassword]
    );

    console.log("Admin registered successfully:", { 
      id: newAdmin.rows[0].id, 
      name: newAdmin.rows[0].name, 
      email: newAdmin.rows[0].email,
      phone: newAdmin.rows[0].phone
    });
    
    res.json({ 
      id: newAdmin.rows[0].id, 
      name: newAdmin.rows[0].name, 
      email: newAdmin.rows[0].email,
      phone: newAdmin.rows[0].phone
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ error: "Admin registration failed. Please try again." });
  }
});

app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Admin login attempt:', { email, password: password ? '***' : 'missing' });
  
  if (!email || !password) {
    console.log('Missing fields for admin login');
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  try {
    console.log('Querying admin database for email:', email);
    const result = await adminDb.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    console.log('Admin query result:', { found: result.rows.length > 0 });
    
    if (result.rows.length === 0) {
      console.log('Admin not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = result.rows[0];
    console.log('Admin found:', { id: admin.id, name: admin.name, email: admin.email });
    
    const validPassword = await bcrypt.compare(password, admin.password);
    console.log('Password validation:', { valid: validPassword });
    
    if (!validPassword) {
      console.log('Invalid password for admin');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.adminId = admin.id;
    console.log('Admin session set:', { adminId: req.session.adminId });
    
    const responseData = { 
      id: admin.id, 
      name: admin.name, 
      email: admin.email, 
      phone: admin.phone
    };
    console.log('Admin login successful, sending response:', responseData);
    res.json(responseData);
  } catch (e) {
    console.error('Admin login error:', e);
    res.status(500).json({ error: 'Login failed: ' + e.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('User login attempt:', { email, password: password ? '***' : 'missing' });
  
  if (!email || !password) {
    console.log('Missing fields for user login');
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  try {
    console.log('Querying users database for email:', email);
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('User query result:', { found: result.rows.length > 0 });
    
    if (result.rows.length === 0) {
      console.log('User not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    console.log('User found:', { id: user.id, name: user.name, email: user.email });
    
    const match = await bcrypt.compare(password, user.password);
    console.log('Password validation:', { valid: match });
    
    if (!match) {
      console.log('Invalid password for user');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.user = { id: user.id, name: user.name, email: user.email };
    console.log('User session set:', { userId: req.session.user.id });
    
    const responseData = { id: user.id, name: user.name, email: user.email };
    console.log('User login successful, sending response:', responseData);
    res.json(responseData);
  } catch (e) {
    console.error('User login error:', e);
    res.status(500).json({ error: 'Login failed: ' + e.message });
  }
});

// Simple Forgot Password endpoint - verify email and reset password
app.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If newPassword is provided, update the password
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      res.json({ message: 'Password reset successfully' });
    } else {
      // Just verify email exists
      res.json({ message: 'Email verified successfully' });
    }
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Simple Admin Forgot Password endpoint - verify email and reset password
app.post('/admin/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    const result = await adminDb.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // If newPassword is provided, update the password
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await adminDb.query('UPDATE admin_users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      res.json({ message: 'Password reset successfully' });
    } else {
      // Just verify email exists
      res.json({ message: 'Email verified successfully' });
    }
  } catch (e) {
    console.error('Admin forgot password error:', e);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: 'http://127.0.0.1:5500/sign.html' }), (req, res) => {
    console.log('=== Google OAuth Callback Started ===');
    console.log('User object:', req.user);
    console.log('Session before setting user:', req.session);
    
    if (req.user) {
      req.session.user = req.user;
      console.log('Session after setting user:', req.session);
      console.log('Redirecting to: http://127.0.0.1:5500/amazon.html');
      res.redirect('http://127.0.0.1:5500/amazon.html');
    } else {
      console.log('No user object found, redirecting to sign.html');
      res.redirect('http://127.0.0.1:5500/sign.html');
    }
  });
}

app.post('/returns', async (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || !quantity) return res.status(400).json({ error: 'Missing fields' });
  try {
    await db.query(
      'INSERT INTO returns (user_id, product_id, quantity) VALUES ($1, $2, $3)',
      [userId, productId, quantity]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to record return' });
  }
});

app.get('/returns/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM returns WHERE user_id = $1 ORDER BY deleted_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

app.post('/returns/buy-again', async (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || !quantity) return res.status(400).json({ error: 'Missing fields' });
  try {
    // Add to cart (assumes a carts table with user_id, product_id, quantity)
    const existing = await db.query(
      'SELECT * FROM carts WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE carts SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, userId, productId]
      );
    } else {
      await db.query(
        'INSERT INTO carts (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [userId, productId, quantity]
      );
    }
    // Optionally, remove from returns
    await db.query('DELETE FROM returns WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to buy again' });
  }
});

app.delete('/returns/:returnId', async (req, res) => {
  const { returnId } = req.params;
  if (!returnId) return res.status(400).json({ error: 'Missing return ID' });
  try {
    await db.query('DELETE FROM returns WHERE id = $1', [returnId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete return' });
  }
});

app.post('/cart', async (req, res) => {
  const { userId, productId, quantity, deliveryOptionId } = req.body;
  if (!userId || !productId || !quantity) return res.status(400).json({ error: 'Missing fields' });
  try {
    await db.query(
      `INSERT INTO carts (user_id, product_id, quantity, delivery_option_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = carts.quantity + EXCLUDED.quantity, delivery_option_id = $4`,
      [userId, productId, quantity, deliveryOptionId || '1']
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add/update cart item' });
  }
});

app.put('/cart/delivery', async (req, res) => {
  const { userId, productId, deliveryOptionId } = req.body;
  if (!userId || !productId || !deliveryOptionId) return res.status(400).json({ error: 'Missing fields' });
  try {
    await db.query(
      'UPDATE carts SET delivery_option_id = $1 WHERE user_id = $2 AND product_id = $3',
      [deliveryOptionId, userId, productId]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update delivery option' });
  }
});

app.put('/cart/quantity', async (req, res) => {
  const { userId, productId, quantity, deliveryOptionId } = req.body;
  if (!userId || !productId || !quantity) return res.status(400).json({ error: 'Missing fields' });
  try {
    await db.query(
      `INSERT INTO carts (user_id, product_id, quantity, delivery_option_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, delivery_option_id = $4`,
      [userId, productId, quantity, deliveryOptionId || '1']
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update cart quantity' });
  }
});

app.get('/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.delete('/cart/:userId/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  try {
    await db.query('DELETE FROM carts WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

app.delete('/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query('DELETE FROM carts WHERE user_id = $1', [userId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

app.get('/products', async (req, res) => {
  try {
    // Read products from the JSON file
    const fs = await import('fs');
    const path = await import('path');
    const productsPath = path.join(process.cwd(), 'products.json');
    const productsData = fs.readFileSync(productsPath, 'utf8');
    const products = JSON.parse(productsData);
    res.json(products);
  } catch (e) {
    console.error('Error fetching products:', e);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/orders', async (req, res) => {
  const { userId, items } = req.body; // items: [{productId, quantity, priceCents}]
  if (!userId || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Missing fields' });
  try {
    const orderResult = await db.query('INSERT INTO orders (user_id, status) VALUES ($1, $2) RETURNING id', [userId, 'unpaid']);
    const orderId = orderResult.rows[0].id;
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_cents) VALUES ($1, $2, $3, $4)',
        [orderId, item.productId, item.quantity, item.priceCents]
      );
    }
    // Don't clear cart here - cart will only be cleared after successful payment
    res.json({ success: true, orderId });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/orders/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  try {
    const result = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/order-items/:orderId', async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });
  try {
    const result = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
});

app.put('/orders/:orderId/pay', async (req, res) => {
  const { userId } = req.body;
  const { orderId } = req.params;
  if (!userId || !orderId) return res.status(400).json({ error: 'Missing fields' });
  try {
    // Only allow the user who owns the order to update it
    const order = await db.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
    if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    await db.query('UPDATE orders SET status = $1 WHERE id = $2', ['paid', orderId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.get('/admin/dashboard', async (req, res) => {
  try {
    // Get stats from main database
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    const ordersResult = await db.query('SELECT COUNT(*) as count FROM orders');
    const productsResult = await db.query('SELECT COUNT(*) as count FROM products');
    
    // Calculate revenue from order_items for paid orders
    const revenueResult = await db.query(`
      SELECT COALESCE(SUM(oi.quantity * oi.price_cents), 0) as total
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status = 'paid'
    `);
    
    const pendingOrdersResult = await db.query('SELECT COUNT(*) as count FROM orders WHERE status = \'unpaid\'');
    
    // Get admin count
    const adminUsersResult = await adminDb.query('SELECT COUNT(*) as count FROM admin_users');
    
    res.json({
      totalUsers: parseInt(usersResult.rows[0].count),
      totalOrders: parseInt(ordersResult.rows[0].count),
      totalProducts: parseInt(productsResult.rows[0].count),
      totalRevenue: parseFloat(revenueResult.rows[0].total || 0) / 100, 
      pendingOrders: parseInt(pendingOrdersResult.rows[0].count),
      totalAdmins: parseInt(adminUsersResult.rows[0].count)
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.get('/admin/users', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.created_at,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'paid' THEN oi.quantity * oi.price_cents ELSE 0 END), 0) as total_spent_cents
      FROM users u 
      LEFT JOIN orders o ON u.id = o.user_id 
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY u.id, u.name, u.email, u.created_at 
      ORDER BY u.created_at DESC
    `);
    
    // Convert cents to dollars for display
    const usersWithDollars = result.rows.map(user => ({
      ...user,
      total_spent: (user.total_spent_cents / 100).toFixed(2)
    }));
    
    res.json(usersWithDollars);
  } catch (e) {
    console.error('Error fetching users:', e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/admin/orders', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        o.id,
        o.user_id,
        u.name as user_name,
        u.email as user_email,
        o.status,
        o.created_at,
        COALESCE(SUM(oi.quantity * oi.price_cents), 0) as total_amount_cents,
        COUNT(oi.id) as item_count,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price_cents', oi.price_cents,
            'product_name', p.name,
            'product_image', p.image
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY o.id, u.name, u.email, o.status, o.created_at, o.user_id
      ORDER BY o.created_at DESC
    `);
    
    // Convert cents to dollars and format the response
    const ordersWithDollars = result.rows.map(order => ({
      ...order,
      total_amount: (order.total_amount_cents / 100).toFixed(2),
      items: order.items || []
    }));
    
    res.json(ordersWithDollars);
  } catch (e) {
    console.error('Error fetching orders:', e);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/admin/users/:userId/orders', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        o.id,
        o.user_id,
        u.name as user_name,
        u.email as user_email,
        o.status,
        o.created_at,
        COALESCE(SUM(oi.quantity * oi.price_cents), 0) as total_amount_cents,
        COUNT(oi.id) as item_count,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price_cents', oi.price_cents,
            'product_name', p.name,
            'product_image', p.image
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE u.id = $1
      GROUP BY o.id, u.name, u.email, o.status, o.created_at, o.user_id
      ORDER BY o.created_at DESC
    `, [userId]);
    
    // Convert cents to dollars and format the response
    const ordersWithDollars = result.rows.map(order => ({
      ...order,
      total_amount: (order.total_amount_cents / 100).toFixed(2),
      items: order.items || []
    }));
    
    res.json(ordersWithDollars);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

app.delete('/admin/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const adminId = req.session.adminId;
  
  if (!adminId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    // Start transaction
    await db.query('BEGIN');
    
    // Delete user's orders first
    await db.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [userId]);
    await db.query('DELETE FROM orders WHERE user_id = $1', [userId]);
    
    // Delete user's cart
    await db.query('DELETE FROM carts WHERE user_id = $1', [userId]);
    
    // Delete user's returns
    await db.query('DELETE FROM returns WHERE user_id = $1', [userId]);
    
    // Finally delete the user
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await db.query('COMMIT');
    res.json({ success: true, message: 'User and all associated data deleted successfully' });
  } catch (e) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.delete('/admin/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const adminId = req.session.adminId;
  
  if (!adminId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    // Start transaction
    await db.query('BEGIN');
    
    // Delete order items first
    await db.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
    
    // Delete the order
    await db.query('DELETE FROM orders WHERE id = $1', [orderId]);
    
    await db.query('COMMIT');
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (e) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

app.post('/admin/clean-database', async (req, res) => {
  const adminId = req.session.adminId;
  
  if (!adminId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    // Start transaction
    await db.query('BEGIN');
    
    // Delete all data in correct order (respecting foreign keys)
    await db.query('DELETE FROM order_items');
    await db.query('DELETE FROM orders');
    await db.query('DELETE FROM carts');
    await db.query('DELETE FROM returns');
    await db.query('DELETE FROM users WHERE is_admin = false'); // Keep admin users
    
    await db.query('COMMIT');
    res.json({ success: true, message: 'Database cleaned successfully' });
  } catch (e) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to clean database' });
  }
});

app.get('/admin/users/:userId/details', async (req, res) => {
  const { userId } = req.params;
  try {
    // Get user details
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get user's orders
    const ordersResult = await db.query(`
      SELECT 
        o.id,
        o.user_id,
        o.status,
        o.created_at,
        COUNT(oi.id) as item_count,
        COALESCE(SUM(oi.quantity * oi.price_cents), 0) as total_amount_cents
      FROM orders o 
      LEFT JOIN order_items oi ON o.id = oi.order_id 
      WHERE o.user_id = $1 
      GROUP BY o.id, o.user_id, o.status, o.created_at
      ORDER BY o.created_at DESC
    `, [userId]);
    
    // Get user's cart
    const cartResult = await db.query(`
      SELECT 
        c.*,
        p.name as product_name,
        p.image as product_image
      FROM carts c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = $1
    `, [userId]);
    
    // Get user's returns
    const returnsResult = await db.query(`
      SELECT 
        r.*,
        p.name as product_name,
        p.image as product_image
      FROM returns r 
      JOIN products p ON r.product_id = p.id 
      WHERE r.user_id = $1
    `, [userId]);
    
    res.json({
      user: user,
      orders: ordersResult.rows,
      cart: cartResult.rows,
      returns: returnsResult.rows,
      stats: {
        totalOrders: ordersResult.rows.length,
        totalSpent: ordersResult.rows.reduce((sum, order) => sum + parseFloat(order.total_amount_cents || 0), 0) / 100,
        cartItems: cartResult.rows.length,
        returnItems: returnsResult.rows.length
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

app.put('/admin/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const adminId = req.session.adminId;
  
  if (!adminId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.get('/admin/admin-users', async (req, res) => {
  try {
    const result = await adminDb.query('SELECT id, name, email, phone, created_at FROM admin_users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
}); 