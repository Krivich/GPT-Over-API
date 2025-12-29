// src/defaults.ts
export const DEFAULTS = {
    ui: {
        // Language-specific content
        en: {
            appName: 'GPT Over API',
            defaultLanguage: 'en',
            thinkingTimeoutSeconds: 25,
            generationTimeoutSeconds: 240,
            aiThinkingPlaceholder: 'Thinking...',
            sendButtonText: 'Send',
            seo: {
                title: 'GPT Over API — Chat with any LLM',
                description: 'Connect to any LLM API and chat. Open source, self-contained application.',
                canonicalUrl: 'https://your-domain.com/'
            },
            texts: {
                // Main interface
                app: {
                    title: 'Chat with',
                    greeting: 'Hello! How can I help you today?',
                    settingsButton: 'Settings',
                    newChatButton: 'New Chat',
                    chatHistoryTitle: 'Chat History',
                    userInputPlaceholder: 'Type your message...',
                    cancelButton: 'Cancel'
                },
                // Settings
                settings: {
                    title: '⚙️ LLM Settings',
                    apiEndpointLabel: 'API Endpoint',
                    apiKeyLabel: 'API Key',
                    modelLabel: 'Model',
                    saveButton: '✅ Save',
                    hint: 'Changes take effect immediately. API key is stored only in your browser.',
                    defaultApiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
                    defaultModel: 'tngtech/deepseek-r1t2-chimera:free'
                },
                // Messages
                messages: {
                    apiKeyNotConfigured: 'Please configure your LLM settings first.',
                    apiKeySaved: 'LLM config saved.',
                    requestCancelled: 'Request cancelled.',
                    errorPrefix: 'Error: ',
                    emptyMessageError: 'Message cannot be empty.',
                    apiError: 'LLM API Error: '
                },
                // Sidebar
                sidebar: {
                    noChats: 'No chats yet',
                    newChatTitle: 'New Chat',
                    searchPlaceholder: 'Search chats...',
                    noMatchingChats: 'No matching chats'
                },
                context: {
                    inContext: 'in context',
                    tapToRemove: '(tap to remove)',
                    tapToInclude: '(tap to include)'
                }
            }
        },
        ru: {
            appName: 'GPT Over API',
            defaultLanguage: 'ru',
            thinkingTimeoutSeconds: 25,
            generationTimeoutSeconds: 240,
            aiThinkingPlaceholder: 'Думаю...',
            sendButtonText: 'Отправить',
            seo: {
                title: 'GPT Over API — Чат с любой LLM',
                description: 'Подключитесь к любой LLM API и общайтесь. Открытый исходный код, автономное приложение.',
                canonicalUrl: 'https://your-domain.com/'
            },
            texts: {
                // Main interface
                app: {
                    title: 'Чат с',
                    greeting: 'Привет! Как я могу вам помочь сегодня?',
                    settingsButton: 'Настройки',
                    newChatButton: 'Новый чат',
                    chatHistoryTitle: 'История чатов',
                    userInputPlaceholder: 'Введите ваше сообщение...',
                    cancelButton: 'Отмена'
                },
                // Settings
                settings: {
                    title: 'Настройки LLM',
                    apiEndpointLabel: 'API Эндпоинт',
                    apiKeyLabel: 'API Ключ',
                    modelLabel: 'Модель',
                    saveButton: 'Сохранить',
                    hint: 'Изменения вступают в силу немедленно. API ключ хранится только в вашем браузере.',
                    defaultApiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
                    defaultModel: 'tngtech/deepseek-r1t2-chimera:free'
                },
                // Messages
                messages: {
                    apiKeyNotConfigured: 'Пожалуйста, сначала настройте параметры LLM.',
                    apiKeySaved: 'Настройки LLM сохранены.',
                    requestCancelled: 'Запрос отменен.',
                    errorPrefix: 'Ошибка: ',
                    emptyMessageError: 'Сообщение не может быть пустым.',
                    apiError: 'Ошибка LLM API: '
                },
                // Sidebar
                sidebar: {
                    noChats: 'Пока нет чатов',
                    newChatTitle: 'Новый чат',
                    searchPlaceholder: 'Поиск чатов...',
                    noMatchingChats: 'Нет подходящих чатов'
                },
                context: {
                    inContext: 'в контексте',
                    tapToRemove: '(нажмите чтобы убрать)',
                    tapToInclude: '(нажмите чтобы добавить)'
                }
            }
        }
    },
    features: {
        enableChatHistory: true,
        enableSettings: true,
        maxLocalChats: 100
    },
    limits: {
        maxThinkingTime: 60,
        maxGenerationTime: 240,
        maxRetries: 3
    },
    llm: {
        defaultApiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
        defaultModel: 'tngtech/deepseek-r1t2-chimera:free',
        timeouts: {
            generationMs: 60000
        },
        maxRetries: 3,
        retryDelayBaseMs: 1000,
        context: {
            lastMessages: 5,
            ragMessages: 3
        }
    }
} as const;

// Infer the type from the object
export type Config = typeof DEFAULTS;