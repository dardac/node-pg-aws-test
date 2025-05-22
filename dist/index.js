"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./middleware/auth");
require("dotenv").config();
const app = (0, express_1.default)();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.use(express_1.default.json());
// Register endpoint
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    try {
        // Validate email format
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
        // Validate if user exists
        const existingUser = await db_1.pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existingUser.rows.length > 0) {
            throw new Error('Username or email already exists');
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        const result = await db_1.pool.query('INSERT INTO users (username, email, pass) VALUES ($1, $2, $3) RETURNING id, username, email', [username, email, hashedPassword]);
        const newUser = result.rows[0];
        res
            .status(201)
            .json({ message: 'User created successfully', user: newUser });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Validate input
        if (!username || !password) {
            throw new Error('Username and password are required');
        }
        const result = await db_1.pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt_1.default.compare(password, user.pass);
            if (match) {
                const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
                const responseUser = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                };
                res.json({ message: 'Login successful', token, user: responseUser });
            }
            else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        }
        else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Profile endpoint (requires authentication)
app.get('/profile', auth_1.authMiddleware, async (req, res) => {
    const user = req.body;
    try {
        const result = await db_1.pool.query('SELECT id, username, email FROM users WHERE id = $1', [user.userId]);
        if (result.rows.length > 0) {
            const profile = result.rows[0];
            res.json({ message: 'Profile retrieved successfully', user: profile });
        }
        else {
            res.status(404).json({ error: 'User not found' });
        }
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Add friend endpoint (requires authentication)
app.post('/friends/add', auth_1.addFriendMiddleware, async (req, res) => {
    const { friendUsername } = req.body;
    const user = req.body;
    try {
        if (!friendUsername) {
            throw new Error('Friend username is required');
        }
        // Check if the friend exists
        const friendResult = await db_1.pool.query('SELECT id FROM users WHERE username = $1', [friendUsername]);
        if (friendResult.rows.length === 0) {
            throw new Error('Friend not found');
        }
        const friendId = friendResult.rows[0].id;
        // Prevent the user from adding themselves as a friend
        if (friendId === user.userId) {
            throw new Error('Cannot add yourself as a friend');
        }
        // Check if they are already friends in either direction
        const existingFriendship = await db_1.pool.query('SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)', [user.userId, friendId]);
        if (existingFriendship.rows.length > 0) {
            throw new Error('Friendship already exists');
        }
        // Add friendship relationship (bidirectional)
        await db_1.pool.query('INSERT INTO friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING', [user.userId, friendId]);
        res.status(201).json({ message: 'Friend added successfully' });
    }
    catch (error) {
        console.error('Add friend error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// List friends endpoint (requires authentication)
app.get('/friends', auth_1.authMiddleware, async (req, res) => {
    const user = req.body;
    try {
        const result = await db_1.pool.query('SELECT u.id, u.username, u.email FROM friends f JOIN users u ON f.friend_id = u.id WHERE f.user_id = $1', [user.userId]);
        const friends = result.rows;
        res.json({ message: 'Friends retrieved successfully', friends });
    }
    catch (error) {
        console.error('List friends error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
