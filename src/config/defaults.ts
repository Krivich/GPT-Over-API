// src/defaults.ts
export const DEFAULTS = {
    ui: {
        // Language-specific content
        en: {
            appName: 'LocalAIWaves',
            defaultLanguage: 'en',
            thinkingTimeoutSeconds: 25,
            generationTimeoutSeconds: 240,
            aiThinkingPlaceholder: 'Thinking...',
            sendButtonText: 'Send',
            thinkingPlaceholder: 'Thinking...',
            seo: {
                title: 'LocalAIWaves — Experimental Chat Client with Context-Aware Widgets',
                description: 'Experimental chat client that connects to any LLM with an OpenAI-compatible API. Features widget-based UI and automatic context building.',
                canonicalUrl: 'https://your-domain.com/'
            },
            texts: {
                // Main interface
                app: {
                    title: 'LocalAIWaves',
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
                // Collapsed messages
                collapsedMessages: {
                    messagesSkipped: 'messages skipped',
                    messageSkipped: 'message skipped',
                    clickToHide: 'click again to hide messages',
                    clickToHideSingular: 'click again to hide message'
                },
                // Greeting widget
                greeting: {
                    title: 'Welcome to LocalAIWaves!',
                    description: 'Experimental chat client that connects to any LLM with an OpenAI-compatible API. Features widget-based UI and automatic context building.',
                    step1: '1. Configure',
                    step1Desc: 'Click the settings icon to enter your API endpoint and key',
                    step2: '2. Chat',
                    step2Desc: 'Start typing your message in the input box below',
                    step3: '3. Context',
                    step3Desc: 'See which messages are included in context (tap messages to include/exclude)',
                    privacyNote: 'No server required - all data stays on your device except API requests to your chosen provider.'
                }
            }
        },
        ru: {
            appName: 'LocalAIWaves',
            defaultLanguage: 'ru',
            thinkingTimeoutSeconds: 25,
            generationTimeoutSeconds: 240,
            aiThinkingPlaceholder: 'Думаю...',
            sendButtonText: 'Отправить',
            thinkingPlaceholder: 'Думаю...',
            seo: {
                title: 'LocalAIWaves — Экспериментальный клиент чата с контекстно-зависимыми виджетами',
                description: 'Экспериментальный клиент чата, который подключается к любой LLM с API, совместимым с OpenAI. Особенности: интерфейс на основе виджетов и автоматическое построение контекста.',
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
                // Collapsed messages
                collapsedMessages: {
                    messagesSkipped: 'сообщений скрыто',
                    messageSkipped: 'сообщение скрыто',
                    clickToHide: 'нажмите еще раз для скрытия сообщений',
                    clickToHideSingular: 'нажмите еще раз для скрытия сообщения'
                },
                // Greeting widget
                greeting: {
                    title: 'Добро пожаловать в LocalAIWaves!',
                    description: 'Экспериментальный клиент чата, который подключается к любой LLM с API, совместимым с OpenAI. Особенности: интерфейс на основе виджетов и автоматическое построение контекста.',
                    step1: '1. Настройка',
                    step1Desc: 'Нажмите значок настроек, чтобы ввести конечную точку и ключ API',
                    step2: '2. Чат',
                    step2Desc: 'Начните вводить сообщение в поле ввода ниже',
                    step3: '3. Контекст',
                    step3Desc: 'Смотрите, какие сообщения включены в контекст (нажимайте на сообщения, чтобы включить/исключить)',
                    privacyNote: 'Сервер не требуется - все данные остаются на вашем устройстве, кроме запросов к выбранному провайдеру.'
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