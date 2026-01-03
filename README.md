## SecureVault

SecureVault is a modern, responsive digital wallet dashboard built to provide users with a clean interface for managing balances, viewing transactions, and monitoring account activity securely.
The project focuses on usability, performance, and scalable frontend architecture.

## 🚀 Features
-User dashboard with real-time balance overview
-Recent transactions with status indicators
-Skeleton loaders for better UX during data fetching
-Modular UI components using shadcn/ui
-Fully responsive design with Tailwind CSS
-Clean separation of hooks, components, and pages
-Ready for backend integration (Supabase / APIs)

## 🛠️ Tech Stack
-Vite – Fast build tool and dev server
-React – Component-based UI development
-TypeScript – Type safety and scalability
-Tailwind CSS – Utility-first styling
-shadcn/ui – Accessible and reusable UI components
-Lucide Icons – Lightweight SVG icons

## 📁 Project Structure
src/
├── components/
│   ├── ui/              # Reusable UI components
│   └── Layout.tsx
├── hooks/               # Custom React hooks
├── pages/               # Application pages
├── lib/                 # Utility functions
└── main.tsx

## ⚙️ Getting Started (Local Setup)
# Prerequisites
Make sure you have Node.js (LTS) and npm installed.

# Installation & Run
**Clone the repository**

git clone <YOUR_GITHUB_REPO_URL>
# Navigate to the project directory
cd secure-wallet-pro
# Install dependencies
npm install
# Start development server
npm run dev

**The app will be available at:
http://localhost:8080**

## 🧪 Development Notes
Skeleton loaders are used to handle loading states smoothly.
UI components are designed to be reusable and scalable.
The project follows a clean import structure and avoids unnecessary coupling.
Suitable for extension into a full-stack fintech application.

## 🔐 Environment Variables
If backend services are connected (e.g., Supabase), create a .env file:
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here

⚠️ .env is intentionally excluded from version control.

## 📦 Build for Production
npm run build
This generates an optimized production build in the dist/ folder.

## 🌐 Deployment
The project can be deployed on:
Vercel
Netlify
Cloudflare Pages
Build command:
npm run build

Output directory:
dist

## 📌 Future Enhancements
Authentication & role-based access
Backend transaction APIs
Analytics & charts
Dark mode toggle
Security alerts & audit logs

## 👤 Author
** Medhavi **
Frontend Developer | React | TypeScript | UI Engineering
GitHub: https://github.com/medhavibajpai5
