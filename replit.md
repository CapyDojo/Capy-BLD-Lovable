# Replit.md - Enterprise Entity Management System

## Overview

This is a full-stack application for managing corporate entities, ownership structures, and cap tables. The system provides a comprehensive platform for tracking complex ownership relationships, compliance requirements, and financial data across multiple entities.

**Migration Status**: Successfully migrated from Lovable to Replit environment with enterprise-grade data architecture, wouter routing, and comprehensive validation systems.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn/ui components
- **State Management**: TanStack Query for server state, local state with React hooks
- **Canvas Visualization**: React Flow (xyflow) for interactive entity relationship diagrams
- **Routing**: Wouter (migrated from React Router DOM for Replit compatibility)
- **Build Tool**: Vite for development and build processes

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple
- **API Pattern**: RESTful API with `/api` prefix
- **Development**: Hot reloading with Vite middleware integration

### Data Layer Architecture
The application uses a unified repository pattern with enterprise-grade data management:
- **Unified Repository**: Single source of truth for all entity and ownership data
- **Enterprise Data Store**: Handles CRUD operations, validation, and audit trails
- **Business Rule Engine**: Validates ownership relationships and prevents circular ownership
- **Audit System**: Complete change tracking for compliance requirements

## Key Components

### 1. Entity Management System
- **Entity Types**: Corporation, LLC, Partnership, Trust, Individual
- **Entity Storage**: Unified entities with metadata, jurisdictions, and positions
- **Entity Operations**: Create, update, delete with validation and audit trails

### 2. Ownership Management
- **Unified Ownership Model**: Single model replacing dual entity/cap-table system
- **Share Classes**: Different types of equity with voting rights and preferences
- **Ownership Relationships**: Direct ownership tracking with effective/expiry dates
- **Cap Table Views**: Computed views showing ownership percentages and valuations

### 3. Interactive Canvas
- **Visual Hierarchy**: Drag-and-drop entity relationship visualization
- **Magnetic Connections**: Intelligent connection system for ownership relationships
- **Real-time Updates**: Canvas updates reflect data changes immediately
- **Node Types**: Entity nodes and stakeholder nodes with different visual styles

### 4. Data Validation & Business Rules
- **Circular Ownership Detection**: Prevents invalid ownership structures
- **Referential Integrity**: Ensures data consistency across relationships
- **Share Validation**: Validates share allocations don't exceed authorized shares
- **Entity Deletion Validation**: Prevents deletion of entities with dependencies

## Data Flow

### 1. User Interaction Flow
1. User interacts with UI components (forms, canvas, tables)
2. Actions trigger service layer methods
3. Services use unified repository for data operations
4. Repository validates and executes operations
5. Changes trigger UI updates via React Query

### 2. Data Persistence Flow
1. Repository receives data operation request
2. Business rules validation occurs
3. Enterprise data store performs CRUD operations
4. Audit entries are created for compliance
5. Events are emitted for real-time updates
6. Changes are persisted to PostgreSQL

### 3. Canvas Synchronization Flow
1. Canvas loads data from unified repository
2. Ownership relationships are visualized as connections
3. User modifications trigger repository updates
4. Canvas re-renders with latest data
5. Magnetic connection system handles new relationships

## External Dependencies

### Database & Storage
- **PostgreSQL**: Primary database via Neon serverless
- **Drizzle ORM**: Type-safe database operations
- **Local Storage**: Temporary data caching and user preferences

### UI & Visualization
- **Radix UI**: Headless UI components for accessibility
- **React Flow**: Interactive node-based diagrams
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### State Management & Networking
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20, PostgreSQL 16
- **Database**: Neon Database connection via DATABASE_URL
- **Hot Reloading**: Vite development server with HMR
- **Port Configuration**: Application runs on port 5000

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push`
- **Deployment**: Autoscale deployment target on Replit

### Database Schema
- **Entities**: Core entity information with metadata
- **Ownership**: Unified ownership relationships
- **Share Classes**: Equity structure definitions
- **Audit Log**: Change tracking for compliance

## Changelog

### June 18, 2025 - Migration Completion
- **Migration from Lovable to Replit**: Successfully completed full migration with enterprise-grade improvements
- **Router Migration**: Replaced React Router DOM with wouter for better Replit compatibility
- **Enterprise Data Store**: Fixed ID mapping issues in mock data initialization, resolving ownership validation failures
- **Test Function Exposure**: Implemented global test function availability for development environment
- **Security Hardening**: Maintained proper client-server separation throughout migration
- **Component Updates**: Updated all navigation components to use wouter instead of React Router DOM

### June 18, 2025 - Initial Setup
- Project foundation established

## User Preferences

Preferred communication style: Simple, everyday language.