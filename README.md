
# Cat-Hermione — Server

The backend API for Cat-Hermione, a social development events platform. It provides event management, authentication verification, and participation management.

## Features

- RESTful API built with Express.js
- MongoDB database integration
- JWT authentication using JWKS
- Protected API endpoints
- Create, read, update, and delete events
- Retrieve upcoming events
- Search and filter events
- Pagination and sorting
- Join and leave events
- Retrieve events created by the authenticated user
- Retrieve events joined by the authenticated user
- Event ownership verification
- Input validation
- Prevent duplicate event participation
- CORS configuration

## Technologies Used

- Node.js
- Express.js
- MongoDB
- JOSE
- JWT
- dotenv
- CORS

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB database
- Cat-Hermione frontend configured

### Installation

Clone the server repository:

```bash
git clone YOUR_SERVER_GITHUB_REPOSITORY_URL
```

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the server root and configure the required environment variables.

Start the server:

```bash
npm start
```

The server runs on port `5000` by default.

## Environment Variables

Configure the following variables in `.env`:

```env
PORT=5000
DB_NAME=
MONGODB_URI=
CLIENT_URL=
JWT_ISSUER=
JWT_AUDIENCE=
JWKS_URL=
```

Never commit `.env` files or expose secret credentials.

## API Endpoints

### Health Check

| Method | Endpoint |
|---|---|
| GET | `/` |

### Events

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | Retrieve events with filtering and pagination |
| GET | `/api/events/:id` | Retrieve event details |
| POST | `/api/events` | Create an event |
| PATCH | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event |

### Event Participation

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/events/:id/join` | Join an event |
| DELETE | `/api/events/:id/leave` | Leave an event |
| GET | `/api/events/my/joined-events` | Retrieve joined events |
| GET | `/api/events/my/created-events` | Retrieve created events |

Protected endpoints require a valid JWT bearer token.

## Security

- JWT verification using JWKS
- Protected routes require authentication
- Event creators can only manage their own events
- User identity is obtained from the verified token
- Duplicate event participation is prevented
- Server-side validation is applied

## Frontend

The API is designed to work with the Cat-Hermione Next.js frontend.

Frontend repository: Add your client repository URL here.

## Deployment

The backend is designed to be deployed on Render.

Live API URL: Add your deployed server URL here.

## Author

Md. Emran Hossain
