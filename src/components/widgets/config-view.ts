// src/components/widgets/config-view.ts
import { IWidget, IChatPanel } from '../../interfaces.js';
import { appConfig } from '../../config/app-config.js';

export class ConfigView implements IWidget {
    private element: HTMLElement | null = null;
    private widgetId: string;

    constructor(
        private chatPanel: IChatPanel
    ) {
        this.widgetId = `config-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    init(container: HTMLElement): void {
        const templateEl = document.getElementById('config-widget-template');
        if (!(templateEl instanceof HTMLTemplateElement)) {
            throw new Error('Config widget template not found');
        }

        const frag = document.importNode(templateEl.content, true);
        this.element = frag.firstElementChild as HTMLElement;
        if (!this.element) throw new Error('Config widget root element missing');

        const endpointInput = this.element.querySelector('[name="apiEndpoint"]') as HTMLInputElement;
        const keyInput = this.element.querySelector('[name="apiKey"]') as HTMLInputElement;
        const modelInput = this.element.querySelector('[name="model"]') as HTMLInputElement;
        const saveBtn = this.element.querySelector('.config-save-btn') as HTMLElement;

        // Find and setup close button
        const closeBtn = this.element.querySelector('.close-btn') as HTMLElement;

        if (!endpointInput || !keyInput || !modelInput || !saveBtn) {
            throw new Error('Config widget form elements missing');
        }

        // Load config
        const configRaw = localStorage.getItem('gptOverApiConfig');
        let config = configRaw ? JSON.parse(configRaw) : {};
        if (config.apiKey !== undefined || config.apiEndpoint !== undefined || config.model !== undefined) {
            config = { llm: { apiKey: config.apiKey, apiEndpoint: config.apiEndpoint, model: config.model } };
        }
        const llm = config.llm || {};

        endpointInput.value = llm.apiEndpoint || appConfig.get('https://openrouter.ai/api/v1/chat/completions', 'llm.defaultApiEndpoint');
        keyInput.value = llm.apiKey || '';
        modelInput.value = llm.model || appConfig.get('tngtech/deepseek-r1t2-chimera:free', 'llm.defaultModel');

        // Handler for saving
        saveBtn.addEventListener('click', () => {
            const newConfig = {
                llm: {
                    apiEndpoint: endpointInput.value.trim(),
                    apiKey: keyInput.value.trim(),
                    model: modelInput.value.trim()
                }
            };

            localStorage.setItem('gptOverApiConfig', JSON.stringify(newConfig));
            const messageText = appConfig.get('✅ LLM config saved.', 'ui.[lang].texts.messages.apiKeySaved');
            this.chatPanel.addMessage(messageText, 'assistant');

            // Trigger a custom event to notify that config has changed
            window.dispatchEvent(new CustomEvent('llmConfigChanged', { detail: newConfig }));
        });

        // Setup close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.destroy(); // Close the widget when close button is clicked
            });
        }
    }

    update(data?: any): void {
        if (!this.element) return;

        if (data && typeof data === 'object') {
            const endpointInput = this.element.querySelector('[name="apiEndpoint"]') as HTMLInputElement;
            const keyInput = this.element.querySelector('[name="apiKey"]') as HTMLInputElement;
            const modelInput = this.element.querySelector('[name="model"]') as HTMLInputElement;

            if (endpointInput && 'apiEndpoint' in data) {
                endpointInput.value = data.apiEndpoint;
            }
            if (keyInput && 'apiKey' in data) {
                keyInput.value = data.apiKey;
            }
            if (modelInput && 'model' in data) {
                modelInput.value = data.model;
            }
        }
    }

    destroy(): void {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    getElement(): HTMLElement {
        if (!this.element) {
            throw new Error('ConfigView not initialized');
        }
        return this.element;
    }

    getId(): string {
        return this.widgetId;
    }

    getType(): string {
        return 'config';
    }
}