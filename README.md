# Document Management Dashboard

## Finalized Implementation Plan

### Objective
Build a full-stack Document Management Dashboard that allows users to upload PDF documents, track individual upload progress, and receive real-time notifications when background processing completes.

### Tech Stack
- Frontend: React, Vite, Tailwind CSS, Axios, React Router
- Backend: Node.js, Express, MongoDB, Mongoose, Multer
- Real-time: Server-Sent Events (SSE)
- Storage: Local disk uploads directory

### Project Structure

```text
sws/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Document.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── documentRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── uploadRoutes.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── NotificationPanel.jsx
│   │   │   ├── UploadArea.jsx
│   │   │   └── DocumentTable.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Notifications.jsx
│   │   └── services/
│   │       ├── api.js
│   │       └── sse.js
│   └── tailwind.config.js
└── .gitignore
```

### Required Features

1. File upload interface with single and multi-file upload for PDFs.
2. Individual per-file progress indicators, file metadata, and local backend storage.
3. Smart bulk upload behavior with a background processing notification when more than 3 files are uploaded at once.
4. Real-time notification delivery using SSE.
5. Persistent notification center with unread count, read/unread actions, and backend persistence.

### Backend API Plan

- `POST /api/upload` — accept PDF uploads, save files locally, store metadata.
- `GET /api/documents` — list uploaded documents.
- `GET /api/notifications` — fetch stored notifications.
- `PATCH /api/notifications/:id/read` — mark one notification read.
- `PATCH /api/notifications/read-all` — mark all notifications read.
- `GET /api/events` — SSE stream for live notifications.

### Frontend Plan

- Upload page with drag-and-drop/file input.
- File list with real-time progress bars.
- Document table with file metadata and download links.
- Global notification bell and panel.
- SSE connection across pages to display toast notifications.

### Next Steps

1. Configure backend Express API and MongoDB connection.
2. Build frontend components for upload, document table, and notifications.
3. Implement SSE notification streaming and storage.
4. Add UI polish and responsive dashboard styling.
5. Write unit tests after core functionality is complete.

## Initial Setup

1. `cd backend && npm install`
2. `cd ../frontend && npm install`
3. `cd ../backend && npm run dev`
4. `cd ../frontend && npm run dev`

## Notes

- This repository is the first commit of the assessment project.
- The plan focuses on required features first, with optional tests added later.
