// src/utils/markdown.ts

export function md(text: string): string {
    const lines = text.split('\n');
    let result = '';
    let inList = false;
    let inCodeBlock = false;

    // Инлайновые стили (жирный, курсив, код в строке)
    const parseInline = (str: string) => str
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // 1. Обработка блоков кода ```
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                const lang = line.trim().substring(3) || 'text';
                result += `<pre data-lang="${lang}"><code>`;
                inCodeBlock = true;
            } else {
                result += '</code></pre>';
                inCodeBlock = false;
            }
            continue;
        }

        if (inCodeBlock) {
            // Внутри кода просто экранируем и добавляем строку
            result += line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '\n';
            continue;
        }

        // 2. Списки
        const listMatch = line.match(/^[-*+]\s+(.*)/);
        if (listMatch) {
            if (!inList) { result += '<ul>'; inList = true; }
            result += `<li>${parseInline(listMatch[1])}</li>`;
            continue;
        } else if (inList) {
            result += '</ul>';
            inList = false;
        }

        // 3. Заголовки
        const headerMatch = line.match(/^(#{1,3})\s+(.*)/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            result += `<h${level}>${parseInline(headerMatch[2])}</h${level}>`;
            continue;
        }

        // 4. Обычные строки
        if (line.trim() === '') {
            result += '<div class="spacer"></div>';
        } else {
            result += `<p>${parseInline(line)}</p>`;
        }
    }

    if (inList) result += '</ul>';
    if (inCodeBlock) result += '</code></pre>'; // На случай если LLM не закрыла тег
    return result;
}