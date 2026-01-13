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
            thinkingPlaceholder: 'Thinking...',
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
                    apiError: 'LLM API Error: ',
                    apiNotConfiguredMessage: 'LLM is not configured. Please set up your API settings.'
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
                },
                // Greeting widget
                greeting: {
                    title: 'Welcome to LocalAIWaves!',
                    description: 'This is a local chat client that connects to any LLM with an OpenAI-compatible API.',
                    step1: '1. Configure',
                    step1Desc: 'Click the settings icon to enter your API endpoint and key',
                    step2: '2. Chat',
                    step2Desc: 'Start typing your message in the input box below',
                    step3: '3. Manage',
                    step3Desc: 'Use the history button to switch between chats',
                    privacyNote: 'All your data stays on your device - no information is sent to any server.'
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
            thinkingPlaceholder: 'Думаю...',
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
                    apiError: 'Ошибка LLM API: ',
                    apiNotConfiguredMessage: 'LLM не настроен. Пожалуйста, настройте параметры API.'
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
                },
                // Greeting widget
                greeting: {
                    title: 'Добро пожаловать в LocalAIWaves!',
                    description: 'Это локальный клиент чата, который подключается к любой LLM с API, совместимым с OpenAI.',
                    step1: '1. Настройка',
                    step1Desc: 'Нажмите значок настроек, чтобы ввести конечную точку и ключ API',
                    step2: '2. Чат',
                    step2Desc: 'Начните вводить сообщение в поле ввода ниже',
                    step3: '3. Управление',
                    step3Desc: 'Используйте кнопку истории, чтобы переключаться между чатами',
                    privacyNote: 'Все ваши данные остаются на вашем устройстве - никакая информация не отправляется ни на какие серверы.'
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