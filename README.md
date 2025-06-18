# TinyURL Clone

A simple URL shortening service built with Node.js, Express, and MongoDB. This project allows users to create shortened URLs that redirect to their original long URLs.

## Features

- URL shortening functionality
- Redirect from short URL to original URL
- Basic analytics (coming soon)
- RESTful API endpoints
- MongoDB for data storage

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **ID Generation**: nanoid for generating short URLs
- **Environment Management**: dotenv

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/tinyurl-clone.git
   cd tinyurl-clone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   BASE_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`

## API Endpoints

- `POST /api/url/shorten` - Create a short URL
- `GET /:code` - Redirect to the original URL
- `GET /api/url/:code` - Get URL details
- `GET /api/url` - Get all URLs (for development)

## Project Structure

```
.
├── config/           # Database configuration
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/           # Database models
├── routes/           # Route definitions
├── utils/            # Utility functions
├── .env              # Environment variables
├── .gitignore        # Git ignore file
├── index.js          # Application entry point
└── package.json      # Project dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by TinyURL and other URL shortening services
- Built as a learning project for Node.js and Express
