/**
 * Text Sanitizer for Browser SpeechSynthesis (TTS)
 * 
 * Sanitizes AI responses so that browser TTS speaks only clean, natural, human-readable sentences:
 * - Strips Markdown formatting (bold, italic, strikethrough, headings, backticks, code blocks)
 * - Converts markdown links [text](url) into just link text
 * - Strips bullet formatting symbols (-, *, +, •, etc.)
 * - Cleans emojis, decorative symbols, and formatting artifacts
 * - Converts heading/bold title colons into natural sentence pauses
 * - Preserves normal punctuation, numbers, units (e.g. 19:19:19, 5ml/L, 10:30 AM), and sentence meaning
 * - Preserves Indic script characters (Kannada, Hindi, Tamil, Telugu, etc.)
 */
export function cleanTextForSpeech(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleaned = text;

  // 1. Remove code blocks fences and inline code backticks
  cleaned = cleaned.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/`/g, '');

  // 2. Remove Markdown links and images, keeping only link text / alt text
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 3. Remove horizontal rules
  cleaned = cleaned.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '');

  // 4. Remove blockquotes
  cleaned = cleaned.replace(/^[ \t]*>[ \t]?/gm, '');

  // 5. Remove markdown heading markers (#, ##, ###, etc.) at line starts
  cleaned = cleaned.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');

  // 6. Remove list bullets (-, *, +, •, etc.) at line starts (requires trailing whitespace)
  cleaned = cleaned.replace(/^[ \t]*[-*+•⁃‣◦▪▫][ \t]+/gm, '');

  // 7. Remove standalone bullet characters anywhere in text
  cleaned = cleaned.replace(/[•⁃‣◦▪▫]/g, ' ');

  // 8. Convert bold labels ending with colon into clean sentences
  // e.g. **Best Fertilizer:** -> **Best Fertilizer.**
  // e.g. **Best Fertilizer**: -> **Best Fertilizer.**
  cleaned = cleaned.replace(/\*\*([^*]+?):\*\*/g, '**$1.**');
  cleaned = cleaned.replace(/__([^_]+?):__/g, '__$1.__');
  cleaned = cleaned.replace(/\*\*([^*]+?)\*\*:/g, '**$1.**');
  cleaned = cleaned.replace(/__([^_]+?)__:/g, '__$1.__');

  // 9. Remove bold, italic, and strikethrough markdown markers
  cleaned = cleaned.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/___(.*?)___/g, '$1');
  cleaned = cleaned.replace(/__(.*?)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  cleaned = cleaned.replace(/~~(.*?)~~/g, '$1');

  // Remove any loose leftover markdown symbols (* or _)
  cleaned = cleaned.replace(/(^|\s)\*+(\s|$)/g, '$1$2');
  cleaned = cleaned.replace(/(^|\s)_+(\s|$)/g, '$1$2');
  cleaned = cleaned.replace(/\*/g, '');

  // 10. Convert colons after word labels followed by capitalized words into periods
  // e.g. "Best Fertilizer: Use NPK" -> "Best Fertilizer. Use NPK"
  // but preserve digit:digit ratios e.g. "19:19:19", "10:30", "1:2"
  cleaned = cleaned.replace(/([a-zA-Z\u0900-\u0D7F]+):\s+([A-Z\u0900-\u0D7F])/g, '$1. $2');
  // Also colons at end of line: "Recommendations:\n" -> "Recommendations.\n"
  cleaned = cleaned.replace(/([a-zA-Z\u0900-\u0D7F]+):\s*(\n|$)/g, '$1.$2');

  // 11. Remove emojis and special decorative characters
  // Extended_Pictographic matches standard emojis and Unicode pictographs
  cleaned = cleaned.replace(/\p{Extended_Pictographic}/gu, '');
  // Variation selectors, zero-width spaces / joiners
  cleaned = cleaned.replace(/[\uFE0E\uFE0F\u200B-\u200D\u2060]/g, '');
  // Decorative symbols like arrows, stars, checkmarks
  cleaned = cleaned.replace(/[✦★☆✪✓✔✕✖✗✘➤➔➜➡]/g, '');
  // Table pipe separators
  cleaned = cleaned.replace(/\|/g, ' ');

  // 12. Normalize newlines to natural sentence separators
  const lines = cleaned
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  cleaned = lines
    .map((line, idx) => {
      // If line does not end with punctuation, append a period before joining with next line
      if (idx < lines.length - 1 && !/[.!?:;,]$/.test(line)) {
        return line + '.';
      }
      return line;
    })
    .join(' ');

  // 13. Clean up spacing and punctuation artifacts
  // Collapse multiple spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  // Remove space before punctuation: "word ." -> "word."
  cleaned = cleaned.replace(/\s+([.,?!;:])/g, '$1');
  // Collapse duplicate periods: "..", "..." -> "."
  cleaned = cleaned.replace(/\.{2,}/g, '.');
  // Clean up ". ."
  cleaned = cleaned.replace(/\.\s*\./g, '.');

  return cleaned.trim();
}
