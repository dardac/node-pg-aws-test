CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  pass VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friends (
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert a test user
-- Note: The password is hashed using bcrypt
INSERT INTO users (username, email, pass) 
VALUES ('testuser', 'testuser@example.com', '$2b$10$zW8q4z3g5X9y2k1m7n8p4e6x3y9z2w1q7r4t8y2u3i9o5p7a6s8d') 
ON CONFLICT (username) DO NOTHING;