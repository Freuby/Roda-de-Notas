import React from 'react';
import { Bold, Underline, Strikethrough } from 'lucide-react';

const FORMATS = [
  { cmd: 'bold', icon: Bold, title: 'Gras' },
  { cmd: 'underline', icon: Underline, title: 'Souligné' },
  { cmd: 'strikeThrough', icon: Strikethrough, title: 'Barré' },
];

const COLORS = ['#1a1a1a', '#C0392B', '#E67E22', '#D4A017', '#1A3C2F', '#2E6FD8', '#6B46C1'];

const runFormat = (command: string, value?: string) => {
  document.execCommand('styleWithCSS', false, 'true');
  document.execCommand(command, false, value);
};

export const FormatToolbar: React.FC = () => (
  <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
    {FORMATS.map(({ cmd, icon: Icon, title }) => (
      <button
        key={cmd}
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          runFormat(cmd);
        }}
        className="p-1 text-muted hover:text-ink hover:bg-bg rounded"
        title={title}
      >
        <Icon className="w-3.5 h-3.5" />
      </button>
    ))}
    {COLORS.map((c) => (
      <button
        key={c}
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          runFormat('foreColor', c);
        }}
        className="w-3.5 h-3.5 rounded-full border border-border ml-0.5"
        style={{ backgroundColor: c }}
        title="Couleur du texte"
      />
    ))}
  </div>
);
