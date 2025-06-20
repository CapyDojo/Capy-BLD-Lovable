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

### June 20, 2025 - In-Canvas Entity Editing System Complete
- **In-Canvas Edit Panel**: Successfully implemented right-side panel that appears when clicking nodes on structure chart
- **Real-Time Database Sync**: All entity edits immediately update the database via UnifiedEntityService with audit trail logging
- **Dynamic Canvas Updates**: Node data refreshes instantly after edits, reflecting changes in entity names, types, and metadata
- **Professional Edit Interface**: Same comprehensive form fields as Entity Manager (jurisdiction, registration, tax ID, etc.)
- **Smart Form Adaptation**: Form fields dynamically adapt based on entity type (Corporation vs Individual vs Partnership)
- **Seamless UX Integration**: Edit panel opens on node click, hover cards hide during editing, ESC key support maintained
- **Entity State Management**: Local entity state synchronizes with canvas nodes for immediate visual feedback
- **Audit Compliance**: All in-canvas edits logged with 'canvas-edit' identifier for compliance tracking

### June 20, 2025 - Professional Legal Organizational Chart Complete
- **Legal-Standard Layout**: Successfully implemented hierarchical organizational chart following legal professional standards
- **Professional Visual Design**: Clean white background with subtle dot grid pattern, formal chart headers, and color-coded legend system
- **Legal Chart Components**: Added formal title "TechFlow Inc. Organizational Structure" with "Post-Series A Capitalization Table" designation
- **Color-Coded Entity Categories**: Professional legend with blue (founders/management), green (institutional investors), red (early stage), dark blue (subsidiaries)
- **Enhanced Chart Controls**: Professional zoom and navigation controls with clean styling and proper positioning
- **Clean Edge Visualization**: Simplified ownership percentages with professional formatting and consistent styling
- **Fixed Edge Rendering Bug**: Resolved critical issue where ownership relationships weren't displaying as visual connections on canvas
- **Dynamic Entity Mapping**: Implemented proper ReactFlow edge rendering with entity ID mapping for reliable relationship visualization

### June 20, 2025 - Structure Chart Integration Complete
- **Complete System Integration**: Successfully replaced Structure Chart with refined Bump Connect magnetic system
- **Clean Architecture Swap**: Eliminated dual-system complexity by using single magnetic connection approach
- **Sensitivity Control Integration**: Unified sensitivity controls now appear in main sidebar for Structure Chart page
- **Professional Entity Panels**: Legal-focused hover cards with tax status, liability info, and jurisdiction details
- **Enterprise Data Integration**: Full compatibility with existing enterprise data architecture and audit systems
- **Seamless User Experience**: Main Structure Chart now provides magical magnetic connections with professional information display

### June 20, 2025 - Speech Bubble Hover System Complete
- **Speech Bubble Redesign**: Transformed hover cards into speech bubbles emerging from top-right corner of nodes
- **Dynamic Node Scaling**: Hover cards now scale proportionally with node size for visual consistency
- **Intelligent Positioning**: Smart viewport detection with automatic flip logic for screen edge handling
- **Multi-Directional Tails**: CSS speech bubble tails adapt direction based on positioning (left/right/top)
- **Enhanced Visual Polish**: Refined card sizing, spacing, and typography for professional appearance
- **Seamless Integration**: Speech bubbles feel naturally connected to nodes with proper offset and scaling

### June 20, 2025 - Hover Card System Perfected
- **Complete Hover Card Fix**: Resolved persistent hover card issue through first principles debugging approach
- **Mouse Event Flow Optimization**: Fixed conditional logic that was blocking hover card display during seeker node states
- **React Flow Integration**: Memoized nodeTypes object to eliminate React Flow warnings and component recreation issues
- **Clean Event Handling**: Simplified hover callback handler with proper dragging state management
- **Production Ready**: Removed debug logging for clean user experience while maintaining functionality
- **Responsive Design**: Hover cards now appear/disappear instantly on mouse enter/leave with perfect timing

### June 20, 2025 - Complete Visual Feedback System Achievement
- **Bidirectional Visual Feedback**: Successfully implemented complete seeker node color transitions (blue → orange → green) based on proximity to targets
- **Handle-Specific Glowing**: Individual handles now glow orange (interest) and green (connection) when detecting compatible connection points
- **Clean Dragging UX**: Hover cards automatically disappear during drag operations, replaced with in-node connection guidance
- **In-Node Status Indicators**: Connection tips now appear directly within nodes ("Seeking connections", "Move closer", "Ready to connect")
- **ESC Key Restoration**: Restored ESC key functionality for undoing recent connections with proper visual indicators
- **Optimized Sensitivity Settings**: Finalized user-preferred Normal preset (280px orange, 160px green, 300ms dwell time)
- **Proportional Preset Scaling**: Easy (320px/200px/200ms), Normal (280px/160px/300ms), Precise (200px/100px/500ms)
- **Expanded Slider Ranges**: Approach Zone (120-340px), Connection Zone (80-240px), Dwell Time (100-1200ms)
- **Perfect Visual Hierarchy**: Blue glow for active seeker, orange for approach zone, green for connection zone with proper priority handling

### June 20, 2025 - Sidebar Integration Complete
- **Sidebar Integration**: Successfully moved sensitivity controls from separate left panel to bottom of existing sidebar navigation
- **Dynamic Visibility**: Sensitivity controls appear automatically when on Bump Connect page, maintaining clean navigation
- **Fine-Tuned Control**: Implemented 10px increments for precise sensitivity adjustment (approach/connection zones)
- **Component Architecture**: Created BumpConnectWrapper with state management passing sensitivity to both MainLayout and WorkingBumpConnect
- **Real-time Updates**: Sensitivity changes in sidebar immediately affect canvas magnetic behavior and connection zones
- **Clean Interface**: Removed duplicate left panel from WorkingBumpConnect, centralizing all controls in main sidebar

### June 19, 2025 - Bump Connect System Breakthrough
- **Revolutionary Magnetic Connection System**: Successfully implemented working Bump & Connect with simplified 2-zone proximity detection
- **Directional Edge Routing**: Fixed critical edge routing issue - connections now properly route based on actual node positions and drag direction
- **Handle Architecture**: Implemented dual handle system (source/target) for vertical connections only with proper ID mapping
- **Cache Management**: Added edge cache clearing to prevent ReactFlow handle ID conflicts
- **Visual Feedback**: Streamlined visual feedback system (orange→green) with magnetic attraction zones
- **Automatic Connection Creation**: Perfected automatic edge creation with proper ownership percentage assignment (25% default)
- **ReactFlow Integration**: Leveraged ReactFlow's native coordinate system instead of custom absolute positioning overlay
- **Entity Connection Logic**: Restricted connections to vertical-only (top/bottom handles) for logical organizational hierarchies

### June 18, 2025 - Production Readiness & Cleanup
- **Production Cleanup**: Removed development artifacts (architectural audit, simple test runner) from Lovable migration
- **UI Refinement**: Updated navigation labels for business clarity (Structure Chart, System Health, Data Architecture)
- **Comprehensive Testing**: Implemented production-ready stress testing suite for data architecture validation
- **System Health Monitoring**: Built enterprise-grade validation tools with performance metrics and integrity scoring
- **Business-Ready Interface**: Streamlined dashboard and navigation for professional client-facing deployment

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