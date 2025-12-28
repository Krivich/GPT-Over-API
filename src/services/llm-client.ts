// src/services/llm-client.ts
import { ILLMClient } from '../interfaces.js';
import { Message } from '../types.js';
import { appConfig } from '../config/app-config.js';

export class LLMClient implements ILLMClient {
    private config: { apiEndpoint: string; apiKey: string; model: string };

    constructor() {
        // Load config from localStorage
        const configRaw = localStorage.getItem('gptOverApiConfig');
        let config = configRaw ? JSON.parse(configRaw) : {};
        if (config.apiKey !== undefined || config.apiEndpoint !== undefined || config.model !== undefined) {
            config = { llm: { apiKey: config.apiKey, apiEndpoint: config.apiEndpoint, model: config.model } };
        }
        const llm = config.llm || {};

        this.config = {
            apiEndpoint: llm.apiEndpoint || appConfig.get('https://openrouter.ai/api/v1/chat/completions', 'llm.defaultApiEndpoint'),
            apiKey: llm.apiKey || '',
            model: llm.model || appConfig.get('tngtech/deepseek-r1t2-chimera:free', 'llm.defaultModel')
        };
    }

    async call(messages: Message[], signal?: AbortSignal): Promise<string> {
        // Refresh config to get latest values from localStorage
        this.refreshConfig();

        if (!this.config.apiKey) {
            // Instead of throwing an error, return a specific message to trigger settings
            return 'API_KEY_NOT_CONFIGURED';
        }

        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages.map(({ id, metadata, ...apiMsg }) => ({
                    ...apiMsg,
                    role: (apiMsg.role as string) === 'assist' ? 'assistant' : apiMsg.role  // Map 'assist' to 'assistant' for API
                })), // Exclude id and metadata when sending to API, and map roles
                temperature: 0.7,
                max_tokens: 1024
            }),
            signal
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`LLM API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    // Method to manually refresh config from localStorage
    public updateConfig(): void {
        this.refreshConfig();
    }

    // Internal method to refresh config - not part of public interface
    private refreshConfig(): void {
        // Load config from localStorage
        const configRaw = localStorage.getItem('gptOverApiConfig');
        let config = configRaw ? JSON.parse(configRaw) : {};
        if (config.apiKey !== undefined || config.apiEndpoint !== undefined || config.model !== undefined) {
            config = { llm: { apiKey: config.apiKey, apiEndpoint: config.apiEndpoint, model: config.model } };
        }
        const llm = config.llm || {};

        this.config = {
            apiEndpoint: llm.apiEndpoint || appConfig.get('https://openrouter.ai/api/v1/chat/completions', 'llm.defaultApiEndpoint'),
            apiKey: llm.apiKey || '',
            model: llm.model || appConfig.get('tngtech/deepseek-r1t2-chimera:free', 'llm.defaultModel')
        };
    }
}