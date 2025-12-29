// src/services/chat-tfidf-index.ts
import { Message } from '../types.js';

// Минимальная совместимая обертка над tfidf-rag-index.js
class TfidfRagIndex {
    private chunks: string[];
    private _idf: Record<string, number> = {};
    private _termFreq: Record<string, number>[] = [];

    constructor(chunks: string[]) {
        this.chunks = chunks;
        this._buildIndex();
    }

    _tokenize(text: string): string[] {
        const stops = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those', 'my', 'your',
            'его', 'ее', 'её', 'их', 'мой', 'твой', 'наш', 'ваш', 'этот', 'эта', 'это', 'эти', 'тот', 'та',
            'the', 'a', 'an', 'и', 'в', 'на', 'с', 'не', 'что', 'как', 'то', 'но', 'если', 'из', 'по'
        ]);

        return (text || '')
            .toLowerCase()
            .replace(/[^\w\sа-яё]/g, ' ')
            .split(/\s+/)
            .map(w => w.trim().replace(/[^\wа-яё]/g, ''))
            .filter(w => w.length >= 3 && !stops.has(w) && !/^\d+$/.test(w));
    }

    _buildIndex(): void {
        this._termFreq = this.chunks.map(chunk => {
            const tokens = this._tokenize(chunk);
            const tf: Record<string, number> = {};
            tokens.forEach(t => tf[t] = (tf[t] || 0) + 1);
            const total = tokens.length || 1;
            Object.keys(tf).forEach(t => tf[t] /= total);
            return tf;
        });

        const docCount = this.chunks.length;
        const allTerms = new Set<string>();
        this._termFreq.forEach(tf => Object.keys(tf).forEach(t => allTerms.add(t)));

        allTerms.forEach(term => {
            const docsContaining = this._termFreq.filter(tf => tf[term]).length;
            this._idf[term] = Math.log(docCount / (1 + docsContaining)) + 1;
        });
    }

    search(query: string, topK: number): { text: string; score: number; index: number }[] {
        const queryTokens = this._tokenize(query);
        if (queryTokens.length === 0 || this.chunks.length === 0) {
            return [];
        }

        const scores = this._termFreq.map((tf, i) => {
            let score = 0;
            queryTokens.forEach(term => {
                if (tf[term] && this._idf[term]) {
                    score += tf[term] * this._idf[term];
                }
            });
            return { text: this.chunks[i], score, index: i };
        });

        return scores
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
}

export class ChatTfidfIndex {
    private index: TfidfRagIndex | null = null;
    private messageById: Map<string, Message> = new Map();
    private positionToId: string[] = [];

    buildIndex(messages: Message[]): void {
        this.messageById.clear();
        this.positionToId = [];

        // Индексируем только user-сообщения
        const indexable = messages
            .filter(msg => msg.role === 'user')
            .map(msg => {
                this.messageById.set(msg.id, msg);
                return msg;
            });

        if (indexable.length === 0) {
            this.index = null;
            return;
        }

        this.positionToId = indexable.map(msg => msg.id);
        const texts = indexable.map(msg => msg.content);
        this.index = new TfidfRagIndex(texts);
    }

    // THESIS: Возвращаем Message[] вместо string[] для типобезопасности и сохранения метаданных
    findRelevant(query: string, topK: number): Message[] {
        if (!this.index || topK <= 0 || !query.trim()) {
            return [];
        }

        const results = this.index.search(query, topK);
        return results
            .map(r => this.messageById.get(this.positionToId[r.index]))
            .filter((msg): msg is Message => !!msg); // TypeScript guard для фильтрации undefined
    }

    serialize(): string {
        const data = {
            positionToId: this.positionToId,
            timestamp: Date.now()
        };
        return JSON.stringify(data);
    }

    deserialize(dataStr: string, messages: Message[]): boolean {
        try {
            const data = JSON.parse(dataStr);
            this.positionToId = data.positionToId || [];

            // Восстанавливаем messageById
            this.messageById.clear();
            for (const msg of messages) {
                this.messageById.set(msg.id, msg);
            }

            // Перестраиваем индекс только если есть сообщения для индексации
            const indexable = this.positionToId
                .map(id => this.messageById.get(id))
                .filter((msg): msg is Message => !!msg);

            if (indexable.length > 0) {
                const texts = indexable.map(msg => msg.content);
                this.index = new TfidfRagIndex(texts);
                return true;
            }
            return false;
        } catch (e) {
            console.warn('Failed to deserialize TF-IDF index', e);
            return false;
        }
    }
}