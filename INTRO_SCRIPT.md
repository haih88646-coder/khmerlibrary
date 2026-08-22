# Khmer Digital Library - Project Introduction Script

## Project Overview

**Name:** Khmer Digital Library (KDL)  
**Tagline:** Discover, Read, and Save Khmer Books  
**Tech Stack:** React 19 + Vite 8 + Tailwind CSS 4 + Supabase  
**Languages Supported:** Khmer (km) & English (en)  
**Deployment:** Vercel

---

## What is this project?

The **Khmer Digital Library** is a modern web platform designed to preserve, digitize, and make accessible the rich literary heritage of Cambodia. It serves as a centralized digital repository where users can discover, read, and save Khmer books across various categories and authors.

---

## Key Features

### 1. Book Discovery & Browsing
- **Homepage** with hero section, search bar, and curated sections (Featured, New, Popular)
- **Browse page** with advanced filtering by category, author, and source
- **Global Books** integration pulling from external sources like Archive.org and eLibrary of Cambodia
- Real-time stats showing total books, authors, categories, and readers

### 2. Reading Experience
- **PDF Reader** - Full-featured PDF viewer powered by PDF.js
- **TXT Reader** - Clean text reading experience
- Bookmarking and favorites system
- Responsive design for desktop and mobile

### 3. User Features
- **User Authentication** - Sign up, login, forgot password via Supabase Auth
- **Favorites** - Save and manage favorite books
- **Profile** - User profile management
- **Dark/Light Theme** - Toggle between themes
- **AI Assistant** - Smart chatbot powered by OpenRouter/NVIDIA for book recommendations and library help

### 4. Admin Dashboard
- **Book Management** - Add, edit, publish, and feature books
- **Category Management** - Organize books by categories
- **Author Management** - Manage author profiles
- **User Management** - View and manage registered users
- **Site Settings** - Customize hero image, donate QR code, footer, and AI settings
- Protected admin routes with role-based access

### 5. Internationalization (i18n)
- Full bilingual support: **Khmer** and **English**
- Dynamic language switching
- Localized content for books, categories, and authors

### 6. Integrations
- **Supabase** - Backend database, authentication, and storage
- **eLibrary of Cambodia** - API integration for external book sources
- **Archive.org** - Integration for global book archive access
- **OpenRouter / NVIDIA NIM** - AI assistant capabilities

---

## Architecture

```
src/
├── App.jsx                 # Main router & layout configuration
├── main.jsx                # React entry point
├── pages/                  # Page-level components
│   ├── Home.jsx            # Landing page with hero, stats, book sections
│   ├── Browse.jsx          # Book browsing with filters
│   ├── GlobalBooks.jsx     # External book sources
│   ├── BookDetails.jsx     # Individual book page
│   ├── Favorites.jsx       # User favorites
│   ├── Profile.jsx         # User profile
│   ├── auth/               # Login, Signup, ForgotPassword
│   └── admin/              # Admin dashboard pages
├── components/
│   ├── common/             # Shared UI components (Navbar, Footer, BookCard, etc.)
│   ├── admin/              # Admin-specific components
│   └── reader/             # PDF and TXT readers
├── contexts/               # React contexts (Auth, Language, Theme, SiteSettings)
├── hooks/                  # Custom React hooks
├── i18n/                   # Internationalization (km.js, en.js)
├── supabase/               # Supabase client & database queries
├── utils/                  # API utilities (eLibrary, Archive.org)
└── styles/                 # Global CSS with Tailwind
```

---

## Database Schema (Supabase)

- **books** - Book records with metadata, cover, file URLs, views, featured status
- **categories** - Book categories (bilingual names)
- **authors** - Author profiles (bilingual names)
- **users** - User profiles linked to Supabase Auth
- **favorites** - User-book relationships
- **site_settings** - Configurable site settings (hero image, donate QR, etc.)

---

## Security & Performance

- **Content Security Policy** headers configured in Vercel
- **HSTS** and security headers enabled
- **Supabase Row Level Security** for data protection
- **Vite** for fast development and optimized production builds
- **Tailwind CSS 4** with Vite plugin for minimal bundle size

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAILS=admin@example.com
OPENROUTER_API_KEY=your_openrouter_api_key
NVIDIA_API_KEY=your_nvidia_nim_api_key
```

---

## Project Goals

1. **Preserve Khmer Literature** - Digitize and archive Cambodian books
2. **Accessibility** - Make books available to anyone, anywhere, anytime
3. **Community** - Build a community of readers, researchers, and enthusiasts
4. **Modern Experience** - Provide a fast, beautiful, and intuitive reading platform

---

## Current Status

- Core reading and browsing features are fully functional
- Admin dashboard for content management is complete
- AI assistant integration is implemented
- Multi-language support is active
- Ready for content population and deployment
