// src/types.ts

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        tfidfTokens?: string[]; // или просто boolean "indexable"
        indexedAt?: number;      // timestamp индексации
    };
}

export type TerminateReason = 'save' | 'freeze';

export interface Terminable {
    freeze(): void;
}

// Widget interface with deactivation policy
export interface Widget {
    show(): Terminable;
    getType(): string; // Returns the widget type for deactivation management
}

export interface ChatHistoryItem {
    id: string;
    title: string;
    timestamp: number;
}