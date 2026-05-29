# Document Management Dashboard - Complete Setup Guide

## ⚠️ CRITICAL SECURITY NOTICE

**Your MongoDB credentials are exposed in the `.env` file. You MUST rotate these credentials immediately:**

1. Go to MongoDB Atlas: https://account.mongodb.com/
2. In your cluster, go to **Database Access** → **Edit** user credentials
3. Generate a new password/credentials
4. Update your `.env` file with the new credentials
5. Make sure `.env` is in `.gitignore` (already added)

---

## Database Schema & ERD

```mermaid
erDiagram
    Document {
        ObjectId _id PK
        string fileName
        number fileSize
        string fileType
        string filePath
        string status
        date uploadDate
    }
    Notification {
        ObjectId _id PK
        string message
        string type
        boolean read
        date createdAt
    }
```

#### Document Schema (MongoDB collection: `documents`)
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `fileName` | String | Yes | - | Original uploaded file name |
| `fileSize` | Number | Yes | - | Size in bytes |
| `fileType` | String | Yes | - | MIME type (e.g. `application/pdf`) |
| `filePath` | String | Yes | - | Disk path relative to backend root |
| `status` | String | No | `'completed'` | Upload status |
| `uploadDate` | Date | No | `Date.now` | Creation timestamp |

#### Notification Schema (MongoDB collection: `notifications`)
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `message` | String | Yes | - | Notification content |
| `type` | String | No | `'info'` | Classification category (`'success'`, `'error'`, `'info'`) |
| `read` | Boolean | No | `false` | Read tracking state |
| `createdAt` | Date | No | `Date.now` | Creation timestamp |

---

## Project Structure

```
sws/
├── backend/
│   ├── config/db.js              (MongoDB connection)
│   ├── models/
│   │   ├── Document.js           (File metadata schema)
│   │   └── Notification.js       (Notification schema)
│   ├── routes/
│   │   ├── uploadRoutes.js       (File upload API)
│   │   ├── documentRoutes.js     (List documents API)
│   │   ├── notificationRoutes.js (Notification CRUD)
│   │   └── eventRoutes.js        (SSE stream API)
│   ├── .env                      (Local - do NOT commit)
│   ├── .env.example              (Template for env vars)
│   ├── .gitignore                (Ignore node_modules, .env)
│   ├── server.js                 (Express app entry point)
│   ├── sse.js                    (SSE client management)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               (Root component with header)
│   │   ├── main.jsx              (React entry point)
│   │   ├── index.css             (Tailwind imports)
│   │   ├── pages/
│   │   │   └── Dashboard.jsx     (Upload & document library)
│   │   └── services/
│   │       ├── api.js            (Axios HTTP client)
│   │       └── sse.js            (SSE EventSource wrapper)
│   ├── .env.example              (Template for env vars)
│   ├── .gitignore                (Ignore node_modules, dist)
│   ├── vite.config.js            (Vite bundler config)
│   ├── tailwind.config.js        (Tailwind CSS config)
│   ├── postcss.config.js         (PostCSS with Tailwind)
│   └── package.json
│
├── .gitignore                    (Root gitignore)
└── README.md
```

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

**Dependencies installed:**
- `express@4.18.2` - Web framework
- `mongoose@7.7.0` - MongoDB ODM
- `multer@1.4.5-lts.1` - File upload handling
- `cors@2.8.5` - Cross-origin requests
- `dotenv@16.3.1` - Environment variables
- `nodemon@3.0.1` (dev) - Auto-reload during development

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and update `MONGO_URI`:

```env
MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@cluster0.ugjba06.mongodb.net/document-dashboard?retryWrites=true&w=majority
PORT=4001
```

**Important:** 
- Replace `<USERNAME>` and `<PASSWORD>` with your MongoDB Atlas credentials
- Must include database name: `/document-dashboard`
- The database will be created automatically on first upload

### 3. Start the Backend

```bash
npm run dev
```

**Expected output:**
```
MongoDB connected to mongodb+srv://.../document-dashboard?appName=Document-Dashboard
Backend running on http://localhost:4001
```

### 4. Verify Backend Health

```bash
curl http://localhost:4001/api/health
# Response: {"status":"ok"}
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

**Dependencies installed:**
- `react@18.3.1` - UI library
- `react-dom@18.3.1` - React DOM rendering
- `vite@5.4.1` - Build tool
- `tailwindcss@3.4.6` - CSS utility framework
- `axios@1.5.0` - HTTP client
- `react-hot-toast@2.5.3` - Toast notifications
- `react-router-dom@6.17.0` - Routing

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

**Content of `.env.local`:**
```env
VITE_API_URL=http://localhost:4001/api
```

:::note
The default value in `services/api.js` already points to `http://localhost:4001/api`, but defining `.env.local` is recommended for clarity.
:::

### 3. Start the Frontend (Development)

```bash
npm run dev
```

**Expected output:**
```
VITE v5.4.1 ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 4. Build for Production

```bash
npm run build
```

Creates optimized bundle in `frontend/dist/`.

---

## API Endpoints

### Upload Files
```bash
POST /api/upload
Content-Type: multipart/form-data

files: <PDF files>
```

**Response:**
```json
{
  "documents": [
    {
      "_id": "...",
      "fileName": "document.pdf",
      "fileSize": 1024,
      "fileType": "application/pdf",
      "filePath": "uploads/1234567890-document.pdf",
      "status": "completed",
      "uploadDate": "2024-..."
    }
  ]
}
```

**Triggers bulk notification if > 3 files uploaded.**

### List Documents
```bash
GET /api/documents
```

**Response:**
```json
[
  {
    "_id": "...",
    "fileName": "document.pdf",
    "fileSize": 1024,
    "fileType": "application/pdf",
    "filePath": "uploads/...",
    "status": "completed",
    "uploadDate": "2024-..."
  }
]
```

### Get Notifications
```bash
GET /api/notifications
```

**Response:**
```json
[
  {
    "_id": "...",
    "message": "4 files uploaded successfully",
    "type": "success",
    "read": false,
    "createdAt": "2024-..."
  }
]
```

### Mark Notification as Read
```bash
PATCH /api/notifications/:id/read
```

### Mark All as Read
```bash
PATCH /api/notifications/read-all
```

### Real-time Notifications (SSE)
```bash
GET /api/events
```

**Browser usage:**
```javascript
const source = new EventSource('http://localhost:4001/api/events');
source.addEventListener('notification', (event) => {
  const notification = JSON.parse(event.data);
  console.log(notification);
});
```

---

## Full Application Workflow

### Development (Local)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:4001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Open browser:** http://localhost:5173

### Testing Upload Flow

1. **Upload 1-3 files:**
   - Individual progress bars show per-file progress
   - No bulk notification sent
   - Files appear in Document Library after upload

2. **Upload 4+ files:**
   - Background bulk processing notification sent
   - Toast notification appears in UI
   - All files appear in Document Library

### Downloading Files

Click "Download" in Document Library to fetch the file from `/uploads/{filePath}`.

---

## Troubleshooting

### Backend won't start - "Port 4001 in use"

```bash
# Use different port
set PORT=4002  # Windows PowerShell: $env:PORT=4002
npm run dev
# Then update frontend .env.local: VITE_API_URL=http://localhost:4002/api
```

### Frontend can't reach backend

- ✅ Verify backend is running on correct port
- ✅ Check `.env.local` has correct `VITE_API_URL`
- ✅ Check browser developer console for CORS errors
- ✅ Ensure CORS is enabled in `backend/server.js`

### MongoDB connection fails

- ✅ Verify `MONGO_URI` includes database name
- ✅ Check credentials are correct (not expired)
- ✅ Verify IP whitelist in MongoDB Atlas (should be 0.0.0.0/0)
- ✅ Test connection: `mongo "your-connection-string"`

### Uploaded files don't appear in Document Library

- ✅ Frontend error? Check browser console
- ✅ Backend error? Check terminal output
- ✅ Database issue? Check MongoDB Atlas collection `documents` exists

### SSE notifications not arriving

- ✅ Verify browser can reach `/api/events` endpoint
- ✅ Check network tab for EventSource connection (should be open)
- ✅ Verify backend is broadcasting: Check SSE client map

---

## File Storage & Cleanup

- **Uploads stored in:** `backend/uploads/`
- **File naming:** `{timestamp}-{original-filename}`
- **Database records:** `MongoDB.document-dashboard.documents`
- **To clean up:** Delete files from `backend/uploads/` and clear MongoDB

---

## Environment Variables Summary

### Backend (`.env`)
```env
MONGO_URI=mongodb+srv://user:pass@cluster0.../document-dashboard?retryWrites=true&w=majority
PORT=4001  # optional, defaults to 4000
```

### Frontend (`.env.local`)
```env
VITE_API_URL=http://localhost:4001/api
```

---

## Git & Version Control

### Files to Ignore (Already configured in .gitignore)
- `node_modules/` - Dependencies
- `.env` - Local credentials
- `dist/` - Build output
- `uploads/` - User-uploaded files
- `*.log` - Log files

### Safe to Commit
- `package.json` - Dependency manifest
- `package-lock.json` - Locked versions
- `.env.example` - Template (no real credentials)
- All source code files

---

## Production Deployment Notes

### Before Deploying:

1. ✅ Rotate MongoDB credentials
2. ✅ Update frontend `VITE_API_URL` to production backend URL
3. ✅ Build frontend: `npm run build`
4. ✅ Set backend `PORT` environment variable
5. ✅ Enable HTTPS for SSE connections (required for production)

### Environment-specific values

**Development:**
```
VITE_API_URL=http://localhost:4001/api
MONGO_URI=mongodb+srv://dev-user:dev-pass@...
```

**Production:**
```
VITE_API_URL=https://api.yourdomain.com/api
MONGO_URI=mongodb+srv://prod-user:prod-pass@...
PORT=443 (or 80 + reverse proxy)
```

---

## Support & Common Issues

**Q: Where are uploaded files stored?**  
A: In `backend/uploads/` directory and metadata in MongoDB.

**Q: Can I delete uploaded files?**  
A: Yes, delete from `backend/uploads/` and remove document record from MongoDB.

**Q: How long are notifications kept?**  
A: Indefinitely in MongoDB. Implement cleanup logic in production.

**Q: Does SSE work across browsers/tabs?**  
A: Each browser tab opens its own SSE connection and receives notifications independently.

**Q: What happens if backend restarts?**  
A: All SSE connections close. Frontend auto-reconnects. No notification loss (persisted in DB).

