// src/interfaces.ts

import { Message } from './types.js';
import { Terminable } from './types.js';

// Interface for chat panel functionality
export interface IChatPanel {
  clear(): void;
  addMessage(text: string, role: 'user' | 'assistant'): void;
  addMessageWidget(widget: HTMLElement, role: 'user' | 'assistant'): void;
  getElement(): HTMLElement;
}

// Interface for LLM client functionality
export interface ILLMClient {
  call(messages: Message[], signal?: AbortSignal): Promise<string>;
  updateConfig(): void;
}

// Interface for configuration system
export interface IAppConfig {
  init(): Promise<void>;
  get<T>(defaultValue: T, path: string): T;
  getText(key: string, fallback?: string): string;
  setLanguage(language: string): Promise<void>;
  getCurrentLanguage(): string;
  getCurrentModel(): string;
  updateTitleWithModel(): void;
}

// Interface for widgets (already exists in types.ts but can be enhanced)
export interface IWidget {
  show(): Terminable;
  getType(): string;
}

// Interface for markdown formatting
export interface IMarkdownFormatter {
  format(text: string): string;
}

// Interface for chat history management
export interface IChatHistoryManager {
  addChat(title: string): string;
  setCurrentChat(chatId: string): void;
  setOnChatSelect(handler: (chatId: string) => void): void;
  setOnNewChat(handler: () => void): void;
  renderChatHistory(): void;
}