# LocalAIWaves: Your Local, Zero-Server Chat Client

## Overview

LocalAIWaves is a **single HTML file** that lets you chat with any LLM that has an OpenAI-compatible API endpoint. No servers, no accounts, no data leaving your browser. The application is designed with a component-based architecture and follows minimalism principles, focusing on privacy, performance, and user control over context.

## Key Features

### Core Functionality
- Connect to **any OpenAI-compatible API** (OpenAI, OpenRouter, LMStudio, Ollama, vLLM, etc.)
- Save and load **multiple chat histories** in browser's localStorage
- Switch between models instantly without reloading
- Clean, responsive interface that works on mobile and desktop
- Multi-language support (English/Russian)

### Advanced Context Management
- **Context-aware messaging**: Instead of sending the entire chat history to the LLM, the app intelligently selects relevant messages using TF-IDF indexing
- **Visual context indicators**: See exactly which messages are included in the context with intuitive UI elements
- **Real-time context preview**: Watch context selections update as you type your query
- **Manual context control**: Users can override automatic context selection by toggling individual messages

### Architecture Features
- **Widget-based UI**: Self-contained UI components that can be shown/hidden without breaking the interface
- **Configuration-driven**: Hierarchical configuration with language support and localStorage overrides
- **Client-side only implementation**: Everything runs in the browser with no server dependencies

## Architecture

### Component-Based Design
The application follows a strict component-based architecture with clear separation of concerns:

- **Components**: UI elements that manage DOM and user interactions
  - `ChatPanel`: Manages the chat display area and message rendering
  - `MessageWidget`: Self-contained message component with context toggling capabilities
  - `ConfigView`: Settings widget for LLM configuration
  - `ChatHistoryWidget`: Widget for managing chat history

- **Services**: Business logic and data management
  - `LLMClient`: Handles communication with LLM API endpoints
  - `ChatService`: Orchestrates message flow and session management
  - `MessageContextManager`: Implements intelligent context selection using TF-IDF
  - `ChatTfidfIndex`: Specialized TF-IDF indexing service for message relevance
  - `ChatHistoryManager`: Manages chat persistence in localStorage
  - `WidgetManager`: Handles lifecycle of UI widgets

- **Configuration**: Centralized configuration management
  - `AppConfig`: Manages application-wide configuration with multilingual support
  - `Defaults`: Hierarchical configuration with language-specific content

- **Utils**: Helper functions and utilities
  - `MarkdownFormatter`: Converts markdown to HTML for rich text display

### Interface-Driven Architecture
The system uses a comprehensive interface system that defines clear contracts between components:

- `IChatPanel`: Manages chat display and message rendering
- `ILLMClient`: Handles API communication and request formatting
- `IAppConfig`: Manages application configuration and multilingual support
- `IChatService`: Orchestrates message flow and session state
- `IMessageContextManager`: Implements context selection algorithms
- `IWidget`: Defines self-contained UI components with lifecycle management
- `IChatHistoryManager`: Manages chat history persistence and lifecycle
- `IWidgetManager`: Handles widget lifecycle management

### Data Flow
1. User input flows through `ChatService` to `LLMClient`
2. Context selection happens via `MessageContextManager` using TF-IDF indexing
3. Messages are rendered through `ChatPanel` with `MessageWidget` components
4. Chat history is managed by `ChatHistoryManager` using localStorage
5. Configuration updates are propagated through `AppConfig`
6. UI widgets are managed by `WidgetManager` with proper lifecycle handling

## TF-IDF Context Management System

The application implements an innovative context management system that addresses the token limit problem in LLM interactions:

### How It Works
1. **Indexing**: All user messages are indexed using TF-IDF (Term Frequency-Inverse Document Frequency) algorithm
2. **Relevance Matching**: When a new query is entered, the system finds semantically relevant past messages
3. **Context Assembly**: The system combines:
   - Last N messages (default: 3) - for immediate context
   - K most relevant messages found via TF-IDF (default: 2) - for semantic context
4. **User Control**: Users can manually override context selection by toggling individual messages
5. **Visual Feedback**: Context indicators show which messages are currently in context

### Technical Implementation
- Custom TF-IDF implementation optimized for chat messages
- Stop word lists for both English and Russian languages
- Tokenization that handles technical content and multiple languages
- Chronological sorting of context messages for better LLM understanding
- Real-time context preview with debounced updates for performance

## Build Process

The application uses a custom build process that creates a single self-contained HTML file:

- **Entry Point**: `src/main.ts` is the main application file
- **Bundler**: Uses esbuild to create an IIFE (Immediately Invoked Function Expression) bundle
- **CSS Inlining**: All CSS files are inlined into the HTML during the build process
- **Self-Contained Output**: The build process creates `index.html` with all JavaScript and CSS embedded
- **Template-Based**: Uses `src/markup/template.html` as the base HTML structure

### Build Configuration
- Target: ES2022 for modern browser compatibility
- Format: IIFE for browser execution without module system
- Sourcemaps: Enabled for development debugging
- Watch mode: Available for development with `--watch` flag

## Configuration System

The application features a hierarchical configuration system:

### Configuration Sources (in priority order)
1. **localStorage**: User-specific overrides stored in browser
2. **External JSON**: `app-config.json` file for deployment-specific settings
3. **Defaults**: Built-in defaults with language-specific content

### Language Support
- English and Russian language support
- Automatic language detection based on browser settings
- Configurable through localStorage key `preferred_language`
- All UI text is configurable via the configuration system

## Security & Privacy

- **Client-side only**: No data leaves the browser
- **Local storage**: API keys and chat history stored only in browser's localStorage
- **No tracking**: No analytics, telemetry, or external dependencies
- **API key security**: Keys stored encrypted in localStorage (though users should exercise caution on shared computers)

## Development Philosophy

This project follows several key architectural principles:

### Minimalism
- Code should be understandable within 5 minutes
- No frameworks if functionality can be achieved without them
- HTML templates manage markup, JavaScript only controls behavior

### Component Architecture
- Each component has a single responsibility
- Components manage DOM from static templates in `index.html`
- Dependencies passed explicitly through methods (`setX`, `onY`)
- No global state within components
- Global UX orchestration only in `main.ts`

### Push Architecture
- Components receive updates from outside, don't poll for state
- Interfaces use domain-appropriate terminology, not implementation details
- Clear separation between interface and implementation

### Code Quality
- Self-documenting code through meaningful method and variable names
- Minimal comments - only where truly necessary for understanding complex logic
- Follow principles outlined in PRINCIPLES.md

### Testing Approach
- E2E tests simulate real user behavior
- Focus on logical chains rather than atomic steps
- Isolate domains, not individual steps
- Hard timeouts ensure reliability over completeness
- Write a reproducing test first when implementing new features or fixing bugs, even when working with coding agents

### Feature Development
- Represent new requirements as clear thesis statements
- Add `// THESIS:` comments near the implementation that satisfies each requirement
- Maintain traceability between requirements and implementation