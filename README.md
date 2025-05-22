# Node.js Express Backend with TypeScript and PostgreSQL
This is a RESTful API built with Node.js, Express, TypeScript, and PostgreSQL, dockerized for easy deployment. The application provides user registration, authentication, profile management, and friendship management features. It uses JWT for authentication, bcrypt for password hashing, and PostgreSQL for data storage.

## Features

### User Registration & Authentication:
- POST /register: Register a new user with username, email, and password.
- POST /login: Authenticate a user and return a JWT token.

### User Profile:
- GET /profile: Retrieve the authenticated user's profile (requires JWT).

### Friendship Management:
- POST /friends/add: Add another user as a friend (requires JWT).
- GET /friends: List all friends of the authenticated user (requires JWT).

## Prerequisites

- Node.js: Version 18 or higher (used in development, but not required for Docker).
- Docker: Required to run the application in containers.
- Docker Compose: Required to manage the application and PostgreSQL services.
- Postman is recommended for testing the API endpoints.

## Setup Instructions
### 1. Install dependencies

```
npm i
```

### 2. Configure environment variables.

Create a .env file in the root directory with the following content:PORT=3000
DB_USER=
DB_HOST=
DB_NAME=
DB_PASSWORD=
DB_PORT=
JWT_SECRET=your_jwt_secret_key_change_me

Important: Replace your_jwt_secret_key_change_me with a secure key.

### 3. Build the project

```
npm run build
```

Future improvement: dockerize this step

### 4. Run the application with docker

Ensure Docker and Docker Compose are installed.
Build and start the containers:

```
docker-compose up --build
```

### 5. Test the API

- Import the Postman collection (/postman/Node.js Express Backend API.postman_collection.json) provided in the project.
- Import the Postman environment (postman/dev.postman_environment.json) provided in the project.

- Use Postman to test the endpoints:

Simply run the endpoints in order to create the rows in the database:
1. Register
2. Login
3. Get Profile
4. Add Friend
5. List Friends

#### Note: The 'token' variable will automatically take the value from the `login` endpoint response.


## Notes

- The database credentials in .env (DB_USER, DB_PASSWORD, etc.) are local for development only. In production, I'd use a secrets manager.
- The friends table stores bidirectional relationships (if A is friends with B, B is friends with A).
- The test user (testuser, testpassword) is preloaded for convenience.
- The API runs on http://localhost:3000 by default.

- I'd consider the followin, for scalability enhancements:

#### Database Indexing:

Current: The users table has unique constraints on username and email, which implicitly create indexes. The friends table has a composite primary key (user_id, friend_id).
Improvement: I'd add an index on friends.user_id for faster queries in /friends:CREATE INDEX idx_friends_user_id ON friends(user_id);

#### Caching:

Current: No caching is implemented, so every request hits the database.
Improvement: Use Redis to cache frequently accessed data, such as user profiles (/profile) or friend lists (/friends).
Example: Cache /friends results:
```
const cachedFriends = await redis.get(`friends:${userId}`);
if (cachedFriends) return JSON.parse(cachedFriends);
// Query database and cache result
```

#### Additional:

- Implement rate limiting (e.g., using express-rate-limit) to prevent abuse of endpoints like /login or /register.
- Use a secrets manager (e.g., AWS Secrets Manager) for sensitive variables.
- Integrate logging (e.g., Winston) and monitoring (e.g., Prometheus + Grafana) to track performance and errors.

### Future Improvements/Features:

Store user profile pictures inside in AWS S3.
Add endpoints for removing friends, updating profiles, or resetting passwords.
Implement an ORM (e.g., TypeORM) for complex queries and improved maintainability.
Add unit tests with Jest to ensure endpoint reliability.

