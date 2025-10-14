# Project Structure Guide

This project follows Next.js 13+ App Router best practices with Supabase integration.

## 📁 Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group for authentication
│   │   ├── login/
│   │   │   └── page.js          # Login page
│   │   ├── signup/
│   │   │   └── page.js          # Signup page
│   │   └── layout.js            # Auth layout wrapper
│   ├── (dashboard)/             # Route group for dashboard
│   │   ├── creator/
│   │   │   └── page.js          # Creator dashboard
│   │   ├── marketplace/
│   │   │   └── page.js          # Marketplace page
│   │   └── layout.js            # Dashboard layout wrapper
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   │   └── route.js         # Authentication endpoints
│   │   └── users/               # User-related endpoints
│   ├── globals.css              # Global styles
│   ├── layout.js                # Root layout
│   └── page.js                  # Home page
├── components/                   # Reusable components
│   ├── auth/                    # Authentication components
│   ├── dashboard/               # Dashboard-specific components
│   ├── forms/                   # Form components
│   ├── layout/                  # Layout components
│   └── ui/                      # UI components (buttons, inputs, etc.)
├── hooks/                       # Custom React hooks
│   └── useAuth.js              # Authentication hook
├── lib/                         # Utility libraries
│   ├── supabase/               # Supabase configuration
│   │   ├── auth.js             # Auth utilities
│   │   └── client.js           # Supabase client
│   └── utils/                  # General utilities
│       └── index.js            # Common utility functions
├── store/                       # State management (Context/Zustand/Redux)
└── styles/                      # Additional styles
```

## 🏗️ Architecture Patterns

### Route Groups
- `(auth)` - Authentication pages (login, signup)
- `(dashboard)` - Protected dashboard pages

### Component Organization
- **UI Components**: Basic, reusable components
- **Feature Components**: Components specific to features (auth, dashboard)
- **Layout Components**: Page layout and navigation components

### Supabase Integration
- **Client Configuration**: `lib/supabase/client.js`
- **Auth Utilities**: `lib/supabase/auth.js`
- **Custom Hooks**: `hooks/useAuth.js`

### API Structure
- RESTful API routes in `app/api/`
- Authentication endpoints
- Feature-specific endpoints

## 🔧 Best Practices

1. **File Naming**: Use camelCase for JavaScript files
2. **Component Structure**: One component per file
3. **Import Organization**: Group imports (React, external libraries, internal)
4. **Code Quality**: Use JSDoc comments directly in files when needed for IntelliSense
5. **Environment Variables**: Store sensitive data in `.env.local`

## 🚀 Getting Started

1. Set up your Supabase project
2. Configure environment variables
3. Install dependencies
4. Start developing!

## 📝 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```