# CollabBoard

A real-time collaborative task manager built with React, Node.js, MongoDB, and Socket.io.

## Features

- JWT authentication (register, login)
- Create workspaces and invite teammates via token
- Kanban board with three columns — To Do, In Progress, Done
- Drag and drop tasks between columns
- Real-time sync — all members see changes instantly via WebSocket
- Three roles — Admin, Editor, Viewer
- Task details — priority, due date, assignee
- Comments on tasks with live updates
- Live presence — see who's online on the board

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- @hello-pangea/dnd (drag and drop)
- Socket.io client
- React Router v6
- Axios

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JWT authentication
- bcryptjs

**Infrastructure**
- Docker + Docker Compose (local development)
- MongoDB Atlas (production database)
- Railway (backend hosting)
- Vercel (frontend hosting)

## Local Development

### Prerequisites
- Docker Desktop installed

### Setup

1. Clone the repo
```bash
   git clone https://github.com/YOUR_USERNAME/collabboard.git
   cd collabboard
```

2. Create environment files

   `backend/.env`
```
   PORT=5000
   MONGO_URI=mongodb://mongodb:27017/collabboard
   JWT_SECRET=your_secret_here
   CLIENT_URL=http://localhost:5173
```

   `frontend/.env`
```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
```

3. Start everything
```bash
   docker compose up --build
```

4. Open `http://localhost:5173`

### Useful commands
```bash
docker compose up --build     # rebuild and start
docker compose up             # start without rebuilding
docker compose down           # stop all containers
docker compose down -v        # stop and wipe database
docker compose logs -f backend  # watch backend logs
```

## Project Structure
```
collabboard/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Workspace.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── workspaces.js
│   │   └── tasks.js
│   ├── middleware/
│   │   └── auth.js
│   ├── socket/
│   │   └── handlers.js
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   └── Board.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Column.jsx
        │   ├── TaskCard.jsx
        │   └── TaskModal.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── SocketContext.jsx
        └── services/
            └── api.js
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces` | Get all your workspaces |
| GET | `/api/workspaces/:id` | Get one workspace |
| POST | `/api/workspaces/join/:token` | Join via invite token |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:workspaceId` | Get all tasks |
| POST | `/api/tasks/:workspaceId` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `workspace:join` | client → server | Join a workspace room |
| `task:create` | client → server | Broadcast new task |
| `task:move` | client → server | Drag and drop a task |
| `task:update` | client → server | Edit task details |
| `task:delete` | client → server | Delete a task |
| `comment:add` | client → server | Add a comment |
| `task:created` | server → client | New task appeared |
| `task:updated` | server → client | Task was changed |
| `task:deleted` | server → client | Task was removed |
| `comment:added` | server → client | New comment on a task |
| `presence:update` | server → client | Who is currently online |
