# 🛒 VaaShop

A modern full-stack e-commerce platform built with NestJS, Next.js, and GraphQL. 

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://vaashop.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-99.8%25-blue)](https://www.typescriptlang.org/)
[![Stars](https://img.shields.io/github/stars/SiroBaby/VaaShop)](https://github.com/SiroBaby/VaaShop/stargazers)

## 🌟 Overview

VaaShop is a full-featured e-commerce application developed as a practical project by students from the Vietnam Aviation Academy. The platform features real-time updates, secure authentication, and a modern responsive UI. 

**Live Demo:** [https://vaashop.vercel.app](https://vaashop.vercel.app)

## 🚀 Tech Stack

### Backend
- **Framework:** NestJS
- **API:** GraphQL with Apollo Server
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Clerk
- **Real-time:** Socket.io
- **File Upload:** Cloudinary
- **Webhooks:** Svix

### Frontend
- **Framework:** Next.js 14 (React 18)
- **Styling:** Tailwind CSS, Material-UI (MUI), Emotion
- **State Management:** Apollo Client
- **Authentication:** Clerk
- **UI Components:** MUI Joy, Framer Motion
- **Charts:** Recharts
- **Real-time:** Socket.io Client

## 📋 Features

- 🔐 Secure authentication with Clerk
- 🛍️ Product catalog with search and filtering
- 🛒 Shopping cart functionality
- 💳 Order management
- 📊 Admin dashboard with analytics
- 🔔 Real-time notifications
- 📱 Responsive design
- 🌙 Dark mode support
- 🤖 AI chat integration (n8n)
- 📈 Data visualization

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration (database, Clerk keys, Cloudinary credentials, etc.)

4. Start PostgreSQL with Docker:
```bash
docker-compose up -d
```

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Run database migrations (if applicable):
```bash
npx prisma migrate dev
```

7. Start the backend server:
```bash
# Development mode
npm run start: dev

# Production mode
npm run start:prod
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend/my-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env. local
```
Configure your Clerk publishable key and backend API URL. 

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Docker Management

To stop the Docker containers:
```bash
cd backend
docker-compose down
```

## 📁 Project Structure

```
VaaShop/
├── backend/              # NestJS backend application
│   ├── prisma/          # Database schema and migrations
│   ├── src/             # Source code
│   │   ├── modules/     # Feature modules
│   │   ├── common/      # Shared utilities
│   │   └── main. ts      # Application entry point
│   ├── docker-compose.yml
│   └── package.json
│
└── frontend/            # Next.js frontend application
    └── my-app/
        ├── src/         # Source code
        │   ├── app/     # Next.js app directory
        │   ├── components/  # React components
        │   └── lib/     # Utilities and configs
        └── package.json
```

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test: e2e

# Test coverage
npm run test:cov
```

## 🚢 Deployment

The application is deployed on Vercel:
- **Frontend:** Automatically deployed from the `main` branch
- **Backend:** Deployed with Vercel serverless functions

### Manual Deployment

For backend:
```bash
cd backend
npm run build
npm run start:prod
```

For frontend:
```bash
cd frontend/my-app
npm run build
npm start
```

## 📝 Available Scripts

### Backend
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot-reload
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm run lint` - Lint the code
- `npm run test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint the code

## 🤝 Contributing

This is an academic project, but contributions, issues, and feature requests are welcome! 

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is part of an academic program at Vietnam Aviation Academy. 

## 📧 Contact

For questions or support, please contact the team members through the Vietnam Aviation Academy. 

---
