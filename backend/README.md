# Backend — Document Management Dashboard

## Overview

This backend provides the API for file upload, document storage, notifications, and real-time notification delivery using Server-Sent Events (SSE).

## Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGO_URI` to your MongoDB connection string.
3. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `MONGO_URI` — MongoDB connection URI. It must include the database name.
  Example:
  ```bash
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.ugjba06.mongodb.net/document-dashboard?retryWrites=true&w=majority
  ```

- If you omit a database name, the backend will automatically use `document-dashboard`.

## API Endpoints

### `POST /api/upload`

- Accepts multipart form uploads using the field name `files`.
- Only PDF files are allowed.
- Saves each file in `backend/uploads/`.
- Stores metadata in MongoDB.
- Sends a bulk success notification if more than 3 files are uploaded.

### `GET /api/documents`

- Returns all uploaded documents with metadata.

### `GET /api/notifications`

- Returns all persisted notifications sorted newest first.

### `PATCH /api/notifications/:id/read`

- Marks a single notification as read.

### `PATCH /api/notifications/read-all`

- Marks all notifications as read.

### `GET /api/events`

- Opens an SSE connection for real-time notifications.
- Clients can listen for `notification` events.

## Notes

- File downloads are served from `/uploads/<filename>`.
- Notifications are stored in MongoDB and are available across refreshes.
