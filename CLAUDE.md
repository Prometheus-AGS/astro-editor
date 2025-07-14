# Claude Instructions for Astro Blog Editor Project

## Project Overview

This is a native macOS markdown editor specifically designed for managing and editing Astro content collections. The goal is to create a beautiful, distraction-free writing environment that understands Astro's content structure and provides seamless frontmatter editing, inspired by iA Writer's design philosophy.

## Core Rules

### New Sessions

- Always read `docs/initial-prd.md` and `docs/tasks.md` to understand project context and current status
- Check the git status and project structure to understand what's been implemented

### Progress Tracking

- **CRITICAL:** After completing any major work, update `docs/tasks.md` and mark completed items with `[x]`
- When moving between phases, update the planning document to reflect current status
- If you complete multiple related tasks, update them all at once to keep the plan current

### Development Approach

- We are taking a phased approach to development outlined in `docs/tasks.md`
- **Current Status**: Phase 2.3 (UI refinement and code quality improvements) - partially complete
- Each phase has specific deliverables - ensure these are met before moving to the next phase

## Technology Stack (IMPLEMENTED)

- **Framework:** Tauri v2 (Rust backend + React frontend)
- **Text Editor:** CodeMirror 6 with markdown support
- **Frontend:** React 19 + TypeScript (strict mode)
- **State Management:** Zustand with persistence
- **Styling:** Tailwind CSS v3 + shadcn/ui components (v4 upgrade planned)
- **Icons:** Lucide React + Radix UI icons
- **Forms:** React Hook Form + Zod validation
- **Testing:** Vitest + React Testing Library (frontend), Cargo test (backend)
- **Code Quality:** ESLint, Prettier, Clippy with comprehensive configurations

**CRITICAL:** This project uses Tauri v2. Always refer to Tauri v2 documentation. Many Tauri v1 approaches do NOT work in v2.

## Project Structure

### Frontend Architecture

```
src/
├── components/
│   ├── Layout/           # Main app layout components
│   │   ├── Layout.tsx           # Root layout container
│   │   ├── Sidebar.tsx          # Collections/files navigation
│   │   ├── EditorView.tsx       # CodeMirror integration
│   │   ├── FrontmatterPanel.tsx # Dynamic form generation
│   │   └── UnifiedTitleBar.tsx  # macOS-style window chrome
│   └── ui/               # shadcn/ui components (30+ components)
├── store/
│   └── index.ts          # Zustand store with file operations
├── lib/
│   ├── schema.ts         # Zod schema parsing and form generation
│   └── utils.ts          # Utility functions
└── hooks/                # React hooks
```

### Backend Architecture (Rust)

```
src-tauri/src/
├── commands/             # Tauri command implementations
│   ├── files.rs         # File operations (read, write, create)
│   ├── project.rs       # Project/collection discovery
│   └── watcher.rs       # File system watching
├── models/              # Data structures
│   ├── collection.rs    # Collection and schema definitions
│   └── file_entry.rs    # File metadata and frontmatter
└── parser.rs            # TypeScript config parsing
```

### Project Overview

```
blog-editor/
├── docs/                       # Project documentation
│   ├── images/                 # Screenshots and visual references
│   ├── initial-prd.md          # Product requirements document
│   ├── initial-requirement-notes.md
│   └── tasks.md               # Implementation plan and status
├── dummy-astro-project/        # Test Astro project for development
│   └── src/
│       ├── assets/            # Sample assets (images etc) for content collections
│       │   ├── articles/
│       │   └── notes/
│       ├── content/           # Sample content collections
│       │   ├── articles/      # Collection: Long-form blog posts
│       │   └── notes/         # Collection: Shorter notes/thoughts
│       ├── components/mdx/    # Astron components intende for use inside MDX content items
│       └── content.config.ts  # Astro collection schemas
├── src/                       # Main React application
├── src-tauri/                 # Rust backend code
├── public/                    # Static assets
├── components.json            # shadcn/ui configuration
├── tailwind.config.js         # Tailwind CSS setup
├── vitest.config.ts           # Testing configuration
├── package.json               # Dependencies and scripts
└── README.md                  # Project overview
```

## Current Implementation Status

### ✅ Completed (Phases 1-2)

- Basic Tauri app with React frontend
- File system operations and watching
- Astro content collection discovery and parsing
- CodeMirror 6 integration with markdown support
- Frontmatter parsing and form-based editing
- Dynamic form generation from Zod schemas
- shadcn/ui component library integration
- Comprehensive testing and linting setup
- macOS-native window customization

### 🚧 In Progress (Phase 2.3)

- UI refinement with shadcn components
- Frontmatter panel improvements (forms, auto-growing inputs)
- Left sidebar redesign with collection navigation
- Bug fixes (save refreshing, frontmatter ordering)
- Test data enhancement

### 📋 Next Steps

- Tailwind v4 upgrade
- Editor experience improvements (Phase 3)
- Polish and performance optimizations (Phase 4)

## Development Guidelines

### Code Quality Requirements

- **TypeScript:** Strict typing required, no `any` types
- **React:** Use modern patterns (hooks, function components)
- **State Management:** All state through Zustand store
- **Error Handling:** Graceful degradation and user-friendly messages
- **Performance:** Target <2s app launch, <100ms file operations

### Component Patterns

- Use shadcn/ui components over custom implementations
- Keep components focused and reusable
- Use TypeScript interfaces for all component props
- Implement proper loading states and error boundaries

### Styling Guidelines

- **Primary:** Use Tailwind utilities over custom CSS
- **Spacing:** `p-4` for panels, `gap-2` for small spacing, `gap-4` for larger
- **Icons:** `h-4 w-4` for standard icons, `h-8` for toolbar buttons
- **Colors:** Use CSS variables (`bg-background`, `text-foreground`, etc.)
- **Responsive:** Use `overflow-hidden` with `text-ellipsis` for long text

## Available Commands

### Development

```bash
npm run dev              # Start Tauri dev server
npm run tauri:dev        # Alternative Tauri dev command
npm run build            # Build for production
npm run tauri:build      # Build Tauri app
```

### Code Quality

```bash
# Frontend
npm run lint             # ESLint checking
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Prettier formatting
npm run format:check     # Check Prettier formatting
npm run typecheck        # TypeScript type checking

# Backend
npm run rust:fmt         # Format Rust code
npm run rust:clippy      # Clippy linting
npm run rust:clippy:fix  # Auto-fix Clippy issues

# Combined
npm run check:all        # Run all checks (TS + Rust + tests)
npm run fix:all          # Auto-fix all issues
```

### Testing

```bash
# Frontend Tests (Vitest + React Testing Library)
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:ui          # Run tests with UI
npm run test:coverage    # Coverage report

# Backend Tests (Cargo)
npm run rust:test        # Run Rust tests

# All Tests
npm run test:all         # Run both frontend and backend tests
```

## Testing Strategy

A dummy astro project with most of the relevant files exists at `dummy-astro-project`

### Frontend Testing

- **Store tests:** State management and async operations
- **Component tests:** Rendering and user interactions
- **Error handling:** API failures and edge cases
- **Mocked APIs:** Use `globalThis.mockTauri` for Tauri commands

### Backend Testing

- **Command tests:** File operations with temporary files
- **Model tests:** Data structure validation
- **Integration tests:** Complete workflows
- **Error scenarios:** Permission denied, file not found, etc.

## Architecture Patterns

### State Management

- Single Zustand store in `src/store/index.ts`
- Async actions for all file operations
- State persistence for project path and UI preferences
- Separation of UI state and file content state

### Frontmatter Form Generation

- Dynamic forms generated from Zod schemas in `lib/schema.ts`
- Support for string, number, boolean, date, enum, and array fields
- Real-time validation with error messages
- Sync between form state and file frontmatter

### File Operations

- All file I/O through Tauri commands
- File watching with debounced updates
- Auto-save every 30 seconds and on blur
- Frontmatter hidden from CodeMirror display

## Known Issues & Limitations

### Technical Limitations

- Only supports standard Astro project structures
- Limited to basic Zod schema types
- Regex-based TypeScript parsing (improvement planned)
- macOS only (initial version)

## Key Files to Understand

### Essential Reading

- `docs/initial-prd.md` - Product requirements and vision
- `docs/tasks.md` - Implementation plan and current status
- `src/store/index.ts` - Application state management
- `src/lib/schema.ts` - Schema parsing and form generation
- `src/components/Layout/` - Main UI components

### Configuration Files

- `components.json` - shadcn/ui configuration
- `tailwind.config.js` - Tailwind CSS setup
- `vitest.config.ts` - Testing configuration
- `eslint.config.js` - Linting rules
- `src-tauri/tauri.conf.json` - Tauri app configuration

## Best Practices

### Before Committing

1. Run `npm run check:all` to verify all tests and linting pass
2. Update `docs/tasks.md` with completed work
3. Ensure TypeScript compilation is clean
4. Ask the user to test manually in the app if UI changes were made

### When Adding Features

1. Check if shadcn/ui has a suitable component first
2. Write tests for new functionality
3. Update types and interfaces as needed
4. Consider performance impact for large collections
5. Follow established patterns in existing code

### Code Review Checklist

- TypeScript types are properly defined
- Error handling is implemented
- Components are accessible and responsive
- Performance considerations for large files/collections
- Tests cover new functionality
- Documentation is updated if needed

---

_Keep this file updated as the project evolves. Always verify current implementation matches the guidance provided here._
