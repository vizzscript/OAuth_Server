This backend server handles Google OAuth 2.0 token exchange and refresh for integrations.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values.

3. Start the server:

   ```bash
   npm run dev
   ```

## Routes

- `GET /auth/oauth2callback?code=...` exchanges the Google authorization code for tokens.
- `GET /auth/get-access-token` returns a valid access token, refreshing it when needed.
- `GET /auth/refresh-token` manually refreshes the stored access token.
