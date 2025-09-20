# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron-based Point of Sale (POS) application built with React and Tailwind CSS v4 for Farmacias MS. The system provides offline-first POS functionality with optional Supabase synchronization for multi-branch management. Each branch operates independently but can sync data to a centralized cloud database for business intelligence and management.

### Multi-Branch Architecture
- Each branch has unique `SUCURSAL_ID` and `RAZON_SOCIAL`
- Independent local SQLite databases per installation
- Selective synchronization to Supabase with branch identification
- Prepared for external Next.js dashboard for owners

## Architecture

- **Main Process (main.js)**: Electron main process that handles window creation, IPC communication, and printer operations
- **Renderer Process (src/App.jsx)**: React frontend with test UI for POS functionality
- **Preload Script (preload.js)**: Secure bridge between main and renderer processes via `electronAPI`
- **Printer Service (src/services/printerService.js)**: Handles ticket HTML generation and ESC/POS commands for cash drawer

## Development Commands

```bash
# Start development with hot reload (TypeScript + React)
npm run dev

# Build React app
npm run build:react

# Compile TypeScript for Electron
npm run build:electron

# Build complete project
npm run build

# Build distributable
npm run build:dist

# Type checking
npm run typecheck

# Linting
npm run lint

# Start Vite dev server only
npm run dev:vite

# Start Electron in development mode
npm run dev:electron

# Preview production build
npm run preview
```

## Key IPC Communication

The application uses Electron's IPC for main/renderer communication:

### Legacy Functions (Maintained)
- `print-ticket`: Prints receipt tickets with provided data
- `get-printers`: Returns available system printers  
- `open-cash-drawer`: Sends ESC/POS commands to open cash drawer

### New System Functions
- `auth:login`: User authentication with JWT
- `auth:logout`: Session termination
- `auth:verifyToken`: Token validation
- `db:query`: Database queries
- `db:execute`: Database operations
- `config:getSucursal`: Get branch configuration
- `product:search`: Product search functionality
- `sale:create`: Create new sales transactions

Access all functions via `window.electronAPI` in the renderer process.

## Printer Integration

- Uses system print API for receipt printing (58mm thermal printer format)
- Cash drawer controlled via ESC/POS commands (Buffer: [0x1B, 0x70, 0x00, 0x19, 0xFA])
- Ticket HTML generation includes proper styling for thermal printers

## Technology Stack

- **Electron**: Desktop application framework
- **React 19**: Frontend framework with hooks
- **Tailwind CSS v4**: Utility-first CSS framework via Vite plugin
- **Vite**: Build tool and dev server
- **ESM**: Project uses ES modules (`"type": "module"`)

## File Structure

### Core Files
- `main.js`: Entry point bridge (loads TypeScript in dev, compiled JS in prod)
- `preload.js`: Secure context bridge with full electronAPI
- `vite.config.js`: Vite configuration with React and Tailwind plugins

### Main Process (TypeScript)
- `src/main/index.ts`: Main Electron application class
- `src/main/database/connection.ts`: SQLite database service
- `src/main/database/schema.sql`: Database schema with multi-branch support
- `src/main/ipc/channels.ts`: IPC channel manager
- `src/main/ipc/handlers/`: Individual IPC handlers for each module
- `src/main/services/printer.service.ts`: Enhanced printing service

### Renderer Process (React + TypeScript)
- `src/main.jsx`: React application entry point (migrates to tsx in future)
- `src/renderer/App.tsx`: Main application with routing and authentication
- `src/renderer/pages/`: Application pages (Login, Dashboard, etc.)
- `src/renderer/components/common/`: Reusable UI components
- `src/renderer/store/authStore.ts`: Zustand authentication store

### Shared Code
- `src/shared/types/index.ts`: TypeScript interfaces and types
- `src/shared/constants/index.ts`: Constants and enums
- `src/shared/validators/`: Data validation utilities

### Configuration
- `tsconfig.json`: Main TypeScript configuration
- `tsconfig.electron.json`: Electron-specific TypeScript config
- `tsconfig.node.json`: Node-specific TypeScript config

## Development Process

**IMPORTANT**: When completing any module or functionality:
1. Update this CLAUDE.md file with new information
2. Update PLAN_DESARROLLO.md progress status
3. Document new IPC channels, database schemas, or architectural changes
4. Ensure both files reflect the current state of the project

## Synchronization Strategy

- **Manual Sync**: Available to all user types via button/menu
- **Automatic Sync**: Configurable by admin, triggers on stable network detection
- **Branch Identification**: All synced data includes `SUCURSAL_ID` for multi-tenant separation
- **Conflict Resolution**: Local data takes precedence, cloud serves as backup/reporting source