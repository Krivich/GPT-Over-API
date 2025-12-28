// src/app-config.ts
import { IAppConfig } from '../interfaces.js';
import { DEFAULTS, Config } from './defaults.js';

function deepMerge(target: any, source: any): any {
    if (typeof target !== 'object' || target === null) return source;
    if (typeof source !== 'object' || source === null) return target;
    const result = Array.isArray(target) ? [...target] : { ...target };
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            result[key] = deepMerge(result[key], source[key]);
        }
    }
    return result;
}

class AppConfig implements IAppConfig {
    private _config: Config;
    private _initialized: boolean;
    private _currentLanguage: string;

    constructor() {
        this._config = JSON.parse(JSON.stringify(DEFAULTS)); // Deep copy to avoid reference issues
        this._currentLanguage = 'en'; // Default language
        this._initialized = false;
    }

    async init(): Promise<void> {
        if (this._initialized) return;

        // 1. Из localStorage
        const fromStorage = localStorage.getItem('gptOverApi_config_override');
        if (fromStorage) {
            try {
                const override = JSON.parse(fromStorage);
                this._config = deepMerge(this._config, override);
            } catch (e) {
                console.warn('[AppConfig] Invalid JSON in localStorage');
            }
        }

        // 2. Из внешнего файла
        try {
            const res = await fetch('app-config.json');
            if (res.ok) {
                const override = await res.json();
                localStorage.setItem('gptOverApi_config_override', JSON.stringify(override));
                this._config = deepMerge(this._config, override);
            }
        } catch (e) {
            // Игнорируем
        }

        // Determine preferred language
        const preferredLanguage = localStorage.getItem('preferred_language') ||
                                  navigator.language ||
                                  this._config.ui.en.defaultLanguage;

        this._currentLanguage = preferredLanguage.startsWith('ru') ? 'ru' : 'en';

        // Set the current language config
        this._config = deepMerge(this._config, {
            ui: this._config.ui[this._currentLanguage as keyof typeof this._config.ui] || this._config.ui.en
        });

        this._initialized = true;
        this.patchHtmlByMarkers();
    }

    get<T>(defaultValue: T, path: string): T {
        if (!this._initialized) {
            console.warn('AppConfig not initialized. Call .init() first.');
            return defaultValue;
        }
        if (!path) return defaultValue;

        // Replace [lang] placeholder with current language
        const resolvedPath = path.replace('[lang]', this._currentLanguage);

        return resolvedPath.split('.').reduce((obj: any, key: string) => {
            return obj && obj[key] !== undefined ? obj[key] : defaultValue;
        }, this._config) as T;
    }

    getText(key: string, fallback = ''): string {
        // Use the current language to access language-specific texts
        // If key is in format like "app.title", we want to access ui.[currentLanguage].texts.app.title
        return this.get<string>(fallback, `ui.${this._currentLanguage}.texts.${key}`);
    }

    // Method to switch language
    async setLanguage(language: string): Promise<void> {
        this._currentLanguage = language;
        localStorage.setItem('preferred_language', language);

        // Update the config with the new language
        this._config = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), {
            ui: DEFAULTS.ui[language as keyof typeof DEFAULTS.ui] || DEFAULTS.ui.en
        });

        this.patchHtmlByMarkers();
    }

    getCurrentLanguage(): string {
        return this._currentLanguage;
    }

    patchHtmlByMarkers(): void {
        // Патчим конфиг-ключи
        document.querySelectorAll('[data-config-key]').forEach(el => {
            const element = el as HTMLElement;
            const key = element.dataset.configKey;
            if (!key) return;
            // Replace [lang] placeholder with current language in the key
            const resolvedKey = key.replace('[lang]', this._currentLanguage);
            const value = this.get<string>('', resolvedKey);
            if (value !== '') {
                // Check if there's a specific attribute to update
                const attrToSet = element.dataset.configAttr;
                if (attrToSet) {
                    // Update the specified attribute
                    element.setAttribute(attrToSet, value);
                } else {
                    // Default behavior: update text content
                    if (element.tagName === 'TITLE') {
                        element.textContent = value;
                    } else if (element.hasAttribute('content')) {
                        element.setAttribute('content', value);
                    } else if (element.hasAttribute('href') && resolvedKey.endsWith('.url')) {
                        element.setAttribute('href', value);
                    } else {
                        element.textContent = value;
                    }
                }
            }
        });

        // Патчим текст-ключи
        document.querySelectorAll('[data-text-key]').forEach(el => {
            const element = el as HTMLElement;
            const key = element.dataset.textKey;
            if (!key) return;
            // Replace [lang] placeholder with current language in the key
            const resolvedKey = key.replace('[lang]', this._currentLanguage);
            // The resolvedKey is now in the format like "en.app.title"
            // We want to access ui.en.texts.app.title
            // So we need to insert "texts" after the language part
            const parts = resolvedKey.split('.');
            if (parts.length >= 2) {
                const lang = parts[0];
                const rest = parts.slice(1).join('.'); // e.g., "app.title"
                const value = this.get<string>('', `ui.${lang}.texts.${rest}`);
                if (value !== '') {
                    element.innerHTML = value;
                }
            }
            // Иначе — оставляем то, что в HTML
        });
    }

    getCurrentModel(): string {
        // Get the current model from localStorage config
        const configRaw = localStorage.getItem('gptOverApiConfig');
        let config = configRaw ? JSON.parse(configRaw) : {};
        if (config.apiKey !== undefined || config.apiEndpoint !== undefined || config.model !== undefined) {
            config = { llm: { apiKey: config.apiKey, apiEndpoint: config.apiEndpoint, model: config.model } };
        }
        const llm = config.llm || {};

        // Return the current model or the default model
        return llm.model || this.get('tngtech/deepseek-r1t2-chimera:free', 'llm.defaultModel');
    }

    updateTitleWithModel(): void {
        // Get the current model name
        const currentModel = this.getCurrentModel();

        // Get the base title based on current language
        const baseTitle = this.getText('app.title', 'Chat');

        // Extract just the model name part (without provider prefix if present)
        const modelName = currentModel.split('/').pop() || currentModel;

        // Update the h1 title element to show "Chat with" (the base title)
        const titleElement = document.querySelector('h1[data-text-key]');
        if (titleElement) {
            titleElement.textContent = baseTitle;
        }

        // Update the model name button text to show only the model name
        const modelButtonElement = document.querySelector('span.model-name');
        if (modelButtonElement) {
            modelButtonElement.textContent = modelName;
        }
    }
}

export const appConfig = new AppConfig();