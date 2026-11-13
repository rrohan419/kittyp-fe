import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import type { DoctorSmartPhrase } from '@/services/doctorSmartPhraseService';

type SmartPhraseTextareaProps = Omit<TextareaProps, 'value' | 'onChange'> & {
  value: string;
  phrases: DoctorSmartPhrase[];
  onValueChange: (value: string) => void;
};

function getWordRange(value: string, start: number, end: number) {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const leftWord = before.match(/\S*$/)?.[0] ?? '';
  const rightWord = after.match(/^\S*/)?.[0] ?? '';
  return {
    start: start - leftWord.length,
    end: end + rightWord.length,
    query: leftWord + rightWord,
  };
}

export function SmartPhraseTextarea({
  value,
  phrases,
  onValueChange,
  onFocus,
  onBlur,
  onKeyDown,
  ...textareaProps
}: SmartPhraseTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [, setCaretVersion] = useState(0);
  const selectionStart = textareaRef.current?.selectionStart ?? value.length;
  const selectionEnd = textareaRef.current?.selectionEnd ?? selectionStart;
  const word = getWordRange(value, selectionStart, selectionEnd);
  const suggestions = useMemo(() => {
    const query = word.query.trim().toLocaleLowerCase();
    if (!focused || !suggestionsOpen || query.length < 2) return [];
    return phrases
      .filter((phrase) => phrase.phraseText.toLocaleLowerCase().includes(query))
      .slice(0, 6);
  }, [focused, phrases, suggestionsOpen, word.query]);

  const insertPhrase = (phraseText: string) => {
    const currentStart = textareaRef.current?.selectionStart ?? value.length;
    const currentEnd = textareaRef.current?.selectionEnd ?? currentStart;
    const range = getWordRange(value, currentStart, currentEnd);
    const next = `${value.slice(0, range.start)}${phraseText}${value.slice(range.end)}`;
    onValueChange(next);
    setSuggestionsOpen(false);
    requestAnimationFrame(() => {
      const caret = range.start + phraseText.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(caret, caret);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length && suggestionsOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        insertPhrase(suggestions[activeIndex]?.phraseText ?? suggestions[0].phraseText);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setSuggestionsOpen(false);
        return;
      }
    }
    onKeyDown?.(event);
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <Textarea
          {...textareaProps}
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setSuggestionsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={(event) => {
            setFocused(true);
            setSuggestionsOpen(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onClick={() => {
            setCaretVersion((version) => version + 1);
            setActiveIndex(0);
          }}
          onKeyUp={() => {
            setCaretVersion((version) => version + 1);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls={suggestions.length ? `${textareaProps.id}-suggestions` : undefined}
        />
        {suggestions.length > 0 ? (
          <ul
            id={`${textareaProps.id}-suggestions`}
            role="listbox"
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {suggestions.map((phrase, index) => (
              <li key={phrase.uuid} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={`w-full rounded-sm px-3 py-2 text-left text-sm ${
                    index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertPhrase(phrase.phraseText)}
                >
                  <span className="line-clamp-2 break-words">{phrase.phraseText}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">Type at least 2 characters to find a saved phrase.</p>
    </div>
  );
}
