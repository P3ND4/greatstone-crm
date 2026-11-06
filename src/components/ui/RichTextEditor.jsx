import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Bold, Italic, Link2, List, ListOrdered, Underline } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';

const TOOLS = [
  ['bold', Bold, 'editor.bold'], ['italic', Italic, 'editor.italic'], ['underline', Underline, 'editor.underline'],
  ['insertUnorderedList', List, 'editor.bullets'], ['insertOrderedList', ListOrdered, 'editor.numbers'], ['createLink', Link2, 'editor.link'],
];

/**
 * Basic rich text (bold, italic, underline, lists, link). Grows vertically, wraps long words, never widens the layout.
 * Value is HTML; swap for TipTap/Lexical later without changing the props.
 */
const RichTextEditor = forwardRef(function RichTextEditor({ value, onChange, id, minHeight = 160, maxHeight = 420, ...aria }, ref) {
  const t = useT();
  const el = useRef(null);
  useImperativeHandle(ref, () => el.current);
  useEffect(() => { if (el.current && el.current.innerHTML !== value) el.current.innerHTML = value || ''; }, [value]);

  const run = (cmd) => {
    el.current?.focus();
    if (cmd === 'createLink') {
      const url = window.prompt(t('editor.linkPrompt'), 'https://');
      if (url) document.execCommand('createLink', false, url);
    } else {
      document.execCommand(cmd, false);
    }
    onChange(el.current.innerHTML);
  };

  return (
    <div className="rte">
      <div className="rte__toolbar" role="toolbar" aria-label={t('editor.toolbar')}>
        {TOOLS.map(([cmd, Icon, label]) => (
          <button key={cmd} type="button" className="icon-btn icon-btn--sm" onMouseDown={(e) => e.preventDefault()} onClick={() => run(cmd)} aria-label={t(label)} title={t(label)}><Icon aria-hidden="true" /></button>
        ))}
      </div>
      <div
        ref={el}
        id={id}
        className="rte__area"
        contentEditable
        role="textbox"
        aria-multiline="true"
        tabIndex={0}
        style={{ minHeight, maxHeight }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        suppressContentEditableWarning
        {...aria}
      />
    </div>
  );
});
export default RichTextEditor;
