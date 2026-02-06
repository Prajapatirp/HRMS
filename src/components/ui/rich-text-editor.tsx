'use client';

import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Highlighter } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Enter description...', className = '' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleHighlight = () => {
    // Apply yellow highlight to selected text
    // Using backColor command with yellow color (#fef08a is Tailwind's yellow-200)
    document.execCommand('backColor', false, '#fef08a');
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Bold"
        >
          <Bold className="h-4 w-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Italic"
        >
          <Italic className="h-4 w-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Underline"
        >
          <Underline className="h-4 w-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={handleHighlight}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Highlight"
        >
          <Highlighter className="h-4 w-4 stroke-[2.5]" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-0.5" />
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Bullet List"
        >
          <List className="h-4 w-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4 stroke-[2.5]" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-0.5" />
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyFull')}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 text-gray-700 hover:text-gray-900"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[200px] p-4 focus:outline-none rich-text-content"
        style={{ 
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          lineHeight: '1.6',
          fontSize: '14px',
          color: '#374151',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rich-text-content strong,
        .rich-text-content b {
          font-weight: 600;
          color: #111827;
        }
        .rich-text-content em,
        .rich-text-content i {
          font-style: italic;
        }
        .rich-text-content u {
          text-decoration: underline;
        }
        .rich-text-content mark,
        .rich-text-content [style*="background-color"] {
          background-color: #fef08a !important;
          padding: 2px 4px;
          border-radius: 2px;
        }
        .rich-text-content ul,
        .rich-text-content ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        .rich-text-content li {
          margin: 4px 0;
        }
        .rich-text-content p {
          margin: 8px 0;
        }
        .rich-text-content p:first-child {
          margin-top: 0;
        }
        .rich-text-content p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
