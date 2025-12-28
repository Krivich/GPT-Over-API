// src/components/widgets/config-view.ts
import { IChatPanel } from '../../interfaces.js';
import { Terminable } from '../../types.js';
import { appConfig } from '../../config/app-config.js';

export class ConfigView {
    constructor(
        private chatPanel: IChatPanel
    ) {}

    getType(): string {
        return 'config';
    }

    show(): Terminable {
        const templateEl = document.getElementById('config-widget-template');
        if (!(templateEl instanceof HTMLTemplateElement)) {
            throw new Error('Config widget template not found');
        }

        const frag = document.importNode(templateEl.content, true);
        const widget = frag.firstElementChild as HTMLElement;
        if (!widget) throw new Error('Config widget root element missing');

        const endpointInput = widget.querySelector('[name="apiEndpoint"]') as HTMLInputElement;
        const keyInput = widget.querySelector('[name="apiKey"]') as HTMLInputElement;
        const modelInput = widget.querySelector('[name="model"]') as HTMLInputElement;
        const saveBtn = widget.querySelector('.config-save-btn') as HTMLElement;

        if (!endpointInput || !keyInput || !modelInput || !saveBtn) {
            throw new Error('Config widget form elements missing');
        }

        // Загрузка конфига
        const configRaw = localStorage.getItem('gptOverApiConfig');
        let config = configRaw ? JSON.parse(configRaw) : {};
        if (config.apiKey !== undefined || config.apiEndpoint !== undefined || config.model !== undefined) {
            config = { llm: { apiKey: config.apiKey, apiEndpoint: config.apiEndpoint, model: config.model } };
        }
        const llm = config.llm || {};

        endpointInput.value = llm.apiEndpoint || appConfig.get('https://openrouter.ai/api/v1/chat/completions', 'llm.defaultApiEndpoint');
        keyInput.value = llm.apiKey || '';
        modelInput.value = llm.model || appConfig.get('tngtech/deepseek-r1t2-chimera:free', 'llm.defaultModel');

        // Freeze-функция для внешнего управления
        const freeze = () => {
            widget.querySelectorAll('.ha-input').forEach(el => {
                (el as HTMLInputElement).disabled = true;
            });
            saveBtn.remove();
            widget.classList.add('frozen');
        };

        // Обработчик сохранения
        saveBtn.addEventListener('click', () => {
            const newConfig = {
                llm: {
                    apiEndpoint: endpointInput.value.trim(),
                    apiKey: keyInput.value.trim(),
                    model: modelInput.value.trim()
                }
            };

            localStorage.setItem('gptOverApiConfig', JSON.stringify(newConfig));
            this.chatPanel.addMessage(appConfig.getText('messages.apiKeySaved', '✅ LLM config saved.'), 'assist');

            // Trigger a custom event to notify that config has changed
            window.dispatchEvent(new CustomEvent('llmConfigChanged', { detail: newConfig }));

            freeze(); // после сохранения — фризим
        });

        this.chatPanel.addMessageWidget(widget, 'assist');

        return { freeze };
    }
}