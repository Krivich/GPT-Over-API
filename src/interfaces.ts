// src/interfaces.ts

import { Message } from './types.js';
import { Terminable } from './types.js';

/**
 * Manages the chat display area in the UI, rendering messages with appropriate styling
 * and automatically scrolling to show new content. Supports both text messages
 * and complex message widgets with interactive elements.
 */
export interface IChatPanel {
  clear(): void;
  addMessage(text: string, role: 'user' | 'assistant'): void;
  addMessageWidget(widget: HTMLElement, role: 'user' | 'assistant'): void;
  getElement(): HTMLElement;
}

/**
 * Handles communication with the LLM API endpoint, including request formatting,
 * authentication, and response parsing. Supports request cancellation and
 * dynamically loads configuration from localStorage.
 */
export interface ILLMClient {
  call(messages: Message[], signal?: AbortSignal): Promise<string>;
  updateConfig(): void;
}

/**
 * Manages application-wide configuration with hierarchical defaults,
 * multilingual support, and dynamic UI updates. Loads configuration
 * from both localStorage and external JSON files with deep merging.
 */
export interface IAppConfig {
  init(): Promise<void>;
  get<T>(defaultValue: T, path: string): T;
  setLanguage(language: string): Promise<void>;
  getCurrentLanguage(): string;
  getCurrentModel(): string;
  updateTitleWithModel(): void;
}

/**
 * Represents a self-contained UI component that can be dynamically shown/hidden
 * with lifecycle management through the Terminable interface.
 */
export interface IWidget {
  show(): Terminable;
  getType(): string;
}

/**
 * Converts markdown syntax to HTML for rich text display in chat messages,
 * supporting formatting like bold, italic, code blocks, lists, and headers.
 */
export interface IMarkdownFormatter {
  format(text: string): string;
}

/**
 * Manages chat history persistence in localStorage, including creating new chats,
 * loading previous conversations, and maintaining chat metadata with timestamps.
 * Handles the complete lifecycle of chat sessions.
 */
export interface IChatHistoryManager {
  addChat(title: string): string;
  setCurrentChat(chatId: string): void;
  setOnChatSelect(handler: (chatId: string) => void): void;
  setOnNewChat(handler: () => void): void;
  renderChatHistory(): void;
  loadInitialChat(): void;
  loadChat(chatId: string): void;
  startNewChat(): void;
  saveMessageToChat(message: Message): void;
  saveChatState(messages: Message[]): void;
}

/**
 * Orchestrates the complete message flow from user input to LLM response,
 * managing the chat session state, request lifecycle, and UI updates.
 * Handles message widgets creation and error management.
 */
export interface IChatService {
  sendMessage(content: string): Promise<void>;
  cancelCurrentRequest(): void;
  isProcessing(): boolean;
  getCurrentChatMessages(): Message[];
  addToCurrentChat(message: Message): void;
}

/**
 * Implements intelligent context selection using TF-IDF for relevance matching
 * and maintains manual context overrides. Combines recent messages with
 * semantically relevant older messages to optimize LLM context.
 */
export interface IMessageContextManager {
  getContextMessages(query: string, allMessages: Message[]): Message[];
  updateContextHighlights(query: string, allMessages: Message[]): void;
  applyManualContextOverrides(baseContext: Message[], allMessages: Message[]): Message[];
  toggleMessageInContext(messageId: string, inContext: boolean): void;
  clearContextHighlights(): void;
  updateTfidfIndex(messages: Message[]): void;
  setChatPanel(chatPanel: IChatPanel): void;
}

/**
 * Manages the lifecycle of UI widgets, preventing duplicate displays
 * and handling proper cleanup when widgets are hidden or replaced.
 */
export interface IWidgetManager {
  showWidget(widget: IWidget): void;
  hideWidget(widgetType: string): void;
}