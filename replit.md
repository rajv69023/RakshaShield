# Raksha - Advanced Women's Safety Platform

## Overview

Raksha is a comprehensive women's safety platform that combines real-time emergency response, biometric monitoring, and AI-powered safety assistance. The application provides multi-layered protection through emergency alerts, community guardian networks, voice stress analysis, and location-based safety features. Built as a full-stack TypeScript application, Raksha aims to create a safer environment for women through technology and community support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Built with Vite for fast development and optimized production builds
- **Component System**: Shadcn/ui components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom design tokens, responsive design, and dark mode support
- **State Management**: React Query for server state management and caching, React hooks for local component state
- **Routing**: Wouter for lightweight client-side routing in a single-page application
- **Real-time Communication**: WebSocket integration for live emergency alerts and guardian responses

### Backend Architecture
- **Express.js Server**: RESTful API with TypeScript for type safety across the entire application
- **Service Layer**: Modular services for emergency response, AI analysis, WebSocket management, and storage
- **Real-time Features**: WebSocket server for emergency broadcasts, guardian notifications, and live status updates
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations and schema management
- **External Integrations**: OpenAI API for voice stress analysis and safety recommendations

### Database Design
- **PostgreSQL**: Primary database with comprehensive schema for users, emergencies, guardians, and safety data
- **Core Tables**: Users with emergency contacts, emergency alerts with location data, guardian network for community response, biometric monitoring data, safety zones mapping, and evidence vault for secure storage
- **Relationships**: Well-defined foreign key relationships between users, guardians, emergency alerts, and responses

### Key Features Implementation
- **Emergency System**: Multi-trigger SOS (manual, biometric, voice stress) with automatic contact alerting and guardian notification
- **Biometric Monitoring**: Real-time heart rate and stress level tracking with threshold-based automatic alerts
- **AI Companion**: OpenAI integration for voice stress analysis, safety recommendations, and biometric data analysis
- **Guardian Network**: Community-based emergency response system with location-based matching and response tracking
- **Location Services**: Safety zone mapping, risk assessment, and location-based emergency routing
- **Evidence Vault**: Secure storage for emergency-related media, voice recordings, and incident documentation

### Security & Privacy
- **Real-time Alerts**: WebSocket-based emergency broadcasting to contacts and nearby guardians
- **Location Privacy**: Configurable location sharing with emergency override capabilities
- **Data Protection**: Secure evidence storage with tamper-proof concepts and encrypted sensitive data
- **Multi-channel Communication**: SMS, calls, and in-app notifications for emergency contacts and guardians

## External Dependencies

### Database & ORM
- **@neondatabase/serverless**: Serverless PostgreSQL connection optimized for cloud deployment and scaling
- **drizzle-orm & drizzle-kit**: Type-safe ORM with schema management, migrations, and PostgreSQL dialect support

### Frontend State & Routing
- **@tanstack/react-query**: Server state management, caching, and synchronization for API data
- **wouter**: Lightweight React router for single-page application navigation without excessive bundle size

### UI Components & Styling
- **@radix-ui/react-***: Complete suite of accessible UI primitives including dialogs, dropdowns, tooltips, and form components
- **tailwindcss**: Utility-first CSS framework with custom design system and responsive breakpoints
- **class-variance-authority**: Component variant management for consistent UI patterns
- **lucide-react**: Icon library for consistent iconography throughout the application

### Real-time & Communication
- **ws**: WebSocket implementation for real-time emergency alerts, guardian responses, and status updates
- **connect-pg-simple**: PostgreSQL session store for maintaining user sessions and authentication state

### Development & Build Tools
- **vite**: Fast development server and optimized production builds with React support
- **tsx**: TypeScript execution for development server and build processes
- **esbuild**: Fast JavaScript bundler for server-side code compilation and optimization