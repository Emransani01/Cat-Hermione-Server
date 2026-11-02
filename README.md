# Cat-Hermione — Server

The backend API for **Cat-Hermione**, a social development events platform. It provides event management, authentication verification, and participation management through secure RESTful APIs.

**Live API:** [Cat-Hermione Server](https://cat-hermione-server-nine.vercel.app)

---

## Features

- RESTful API built with Express.js.
- MongoDB database integration.
- JWT authentication using JWKS.
- CORS origin list support for localhost and production.
- Protected API endpoints.
- Create, read, update, and delete community events.
- Retrieve upcoming events.
- Search and filter events.
- Pagination and sorting.
- Join and leave community events.
- Retrieve events created by the authenticated user.
- Retrieve events joined by the authenticated user.
- Event ownership verification.
- Server-side input validation.
- Prevent duplicate event participation.
- Secure authentication and authorization.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- JOSE
- JWT
- dotenv
- CORS

## Getting Started

Follow these instructions to run the backend server locally.

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- MongoDB database
- Cat-Hermione frontend configured

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Emransani01/Cat-Hermione-Server.git
```

**2. Navigate to the project directory**

```bash
cd Cat-Hermione-Server
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create a `.env` file in the server root directory and add the required environment variables.

**5. Start the server**

```bash
npm start
```

The server runs on port `5000` by default.

## Environment Variables

Configure the following variables in your `.env` file:

```env
PORT=5000
DB_NAME=cat-hermione
MONGODB_URI=

CLIENT_URL=http://localhost:3000
JWT_ISSUER=http://localhost:3000
JWT_AUDIENCE=http://localhost:3000
JWKS_URL=http://localhost:3000/api/auth/jwks
```

### Environment Configuration Notes

- `PORT` specifies the backend server port.
- `DB_NAME` specifies the MongoDB database name.
- `MONGODB_URI` contains the MongoDB connection string.
- `CLIENT_URL` defines the allowed frontend origins for CORS. Multiple origins can be separated by commas.
- `JWT_ISSUER` must match the issuer used by Better Auth.
- `JWT_AUDIENCE` must match the expected audience of the JWT.
- `JWKS_URL` must point to the frontend Better Auth JWKS endpoint.

**Example production configuration:**

```env
PORT=5000
DB_NAME=cat-hermione
MONGODB_URI=your_mongodb_connection_string

CLIENT_URL=http://localhost:3000,https://cat-hermione-client-eight.vercel.app

JWT_ISSUER=https://cat-hermione-client-eight.vercel.app
JWT_AUDIENCE=https://cat-hermione-client-eight.vercel.app
JWKS_URL=https://cat-hermione-client-eight.vercel.app/api/auth/jwks
```

**Important:**

- JWT issuer and audience must match the values used when Better Auth signs the tokens.
- The JWKS URL must point to the frontend authentication endpoint.
- Never commit `.env` files or expose database credentials and other sensitive information.
- Configure production environment variables in Vercel before deployment.

## API Endpoints

### Health Check

| Method | Endpoint      | Description      |
| ------ | ------------- | ---------------- |
| GET    | `/`           | Server status    |
| GET    | `/api/health` | API health check |

### Events

| Method | Endpoint          | Description                                   |
| ------ | ----------------- | --------------------------------------------- |
| GET    | `/api/events`     | Retrieve events with filtering and pagination |
| GET    | `/api/events/:id` | Retrieve event details                        |
| POST   | `/api/events`     | Create a new event                            |
| PATCH  | `/api/events/:id` | Update an existing event                      |
| DELETE | `/api/events/:id` | Delete an event                               |

### Event Participation

| Method | Endpoint                        | Description             |
| ------ | ------------------------------- | ----------------------- |
| POST   | `/api/events/:id/join`          | Join an event           |
| DELETE | `/api/events/:id/leave`         | Leave an event          |
| GET    | `/api/events/my/joined-events`  | Retrieve joined events  |
| GET    | `/api/events/my/created-events` | Retrieve created events |

### Authentication

Protected endpoints require a valid JWT bearer token.

Include the token in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Security

The backend implements several security measures:

- JWT verification using JWKS.
- Protected routes requiring authentication.
- Event ownership verification.
- Users can only manage their own events.
- User identity is extracted from the verified JWT.
- Duplicate event participation is prevented.
- Server-side input validation.
- CORS configuration to control allowed origins.

## Frontend Integration

The backend API is designed to work with the Cat-Hermione Next.js frontend.

**Frontend Repository:**  
[Cat-Hermione Client](https://github.com/Emransani01/Cat-Hermione-Client)

**Live Frontend:**  
[https://cat-hermione-client-eight.vercel.app](https://cat-hermione-client-eight.vercel.app)

## Deployment

The backend is deployed on Vercel.

### Deploy to Vercel

Make sure you have configured your Vercel project and linked the server directory.

```bash
vercel link
vercel deploy --prod
```

### Production Configuration

Before deploying:

1. Configure the MongoDB connection string.
2. Set the production `CLIENT_URL`.
3. Configure the correct JWT issuer and audience.
4. Set the production JWKS endpoint.
5. Verify the frontend and backend integration.
6. Deploy the server to Vercel.

**Live API URL:**  
[https://cat-hermione-server-nine.vercel.app](https://cat-hermione-server-nine.vercel.app)

## Repository

**GitHub Repository:**  
[Cat-Hermione Server](https://github.com/Emransani01/Cat-Hermione-Server)

## Author

**Md. Emran Hossain**

---

_Built with Node.js, Express.js, MongoDB, and JOSE._
