import express, { Request, Response } from 'express';
import { pool } from './db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { addFriendMiddleware, authMiddleware } from './middleware/auth';

require("dotenv").config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface ProfileRequest {
  user: JwtPayload;
}

interface AddFriendRequest {
  friendUsername: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface JwtPayload {
  userId: number;
}

// Register endpoint
app.post(
  '/signup',
  async (req: Request<{}, {}, SignupRequest>, res: Response) => {
    const { username, email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    try {
      // Validate email format
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Validate if user exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Username or email already exists');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const result = await pool.query(
        'INSERT INTO users (username, email, pass) VALUES ($1, $2, $3) RETURNING id, username, email',
        [username, email, hashedPassword]
      );

      const newUser: User = result.rows[0];
      res
        .status(201)
        .json({ message: 'User created successfully', user: newUser });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Login endpoint
app.post(
  '/login',
  async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    const { username, password } = req.body;

    try {
      // Validate input
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.pass);
        if (match) {
          const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
          );
          const responseUser: User = {
            id: user.id,
            username: user.username,
            email: user.email,
          };
          res.json({ message: 'Login successful', token, user: responseUser });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Profile endpoint (requires authentication)
app.get('/profile', authMiddleware, async (req, res) => {
  const user = req.body as JwtPayload;

  try {
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [user.userId]
    );
    if (result.rows.length > 0) {
      const profile: User = result.rows[0];
      res.json({ message: 'Profile retrieved successfully', user: profile });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add friend endpoint (requires authentication)
app.post('/friends/add', addFriendMiddleware, async (req, res) => {
  const { friendUsername } = req.body;
  const user = req.body as JwtPayload;

  try {
    if (!friendUsername) {
      throw new Error('Friend username is required');
    }
    // Check if the friend exists
    const friendResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [friendUsername]
    );

    if (friendResult.rows.length === 0) {
      throw new Error('Friend not found');
    }

    const friendId = friendResult.rows[0].id;

    // Prevent the user from adding themselves as a friend
    if (friendId === user.userId) {
      throw new Error('Cannot add yourself as a friend');
    }

    // Check if they are already friends in either direction
    const existingFriendship = await pool.query(
      'SELECT * FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [user.userId, friendId]
    );
    if (existingFriendship.rows.length > 0) {
      throw new Error('Friendship already exists');
    }

    // Add friendship relationship (bidirectional)
    await pool.query(
      'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
      [user.userId, friendId]
    );

    res.status(201).json({ message: 'Friend added successfully' });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List friends endpoint (requires authentication)
app.get('/friends', authMiddleware, async (req: Request, res: Response) => {
  const user = req.body as JwtPayload;

  try {
    const result = await pool.query(
      'SELECT u.id, u.username, u.email FROM friends f JOIN users u ON f.friend_id = u.id WHERE f.user_id = $1',
      [user.userId]
    );
    const friends: User[] = result.rows;
    res.json({ message: 'Friends retrieved successfully', friends });
  } catch (error) {
    console.error('List friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
