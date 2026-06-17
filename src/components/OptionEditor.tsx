import React from 'react';
import { WheelOption } from '../types';

interface Props {
  options: WheelOption[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: 'text' | 'color', value: string) => void;
}

export default function OptionEditor({ options, onAdd, onRemove, onUpdate }: Props) {
  return (
    <div>
      <div className="option-editor">
        {options.map((opt, idx) => (
          <div key={opt.id} className="option-item">
            <span style={{ color: '#5a6a7a', fontSize: 12, width: 16, textAlign: 'center', flexShrink: 0 }}>
              {idx + 1}
            </span>
            <div className="color-dot" style={{ backgroundColor: opt.color }}>
              <input
                type="color"
                value={opt.color}
                onChange={e => onUpdate(opt.id, 'color', e.target.value)}
              />
            </div>
            <input
              className="option-input"
              value={opt.text}
              onChange={e => onUpdate(opt.id, 'text', e.target.value)}
              placeholder="输入选项文字..."
              maxLength={20}
            />
            <button
              className="option-btn delete"
              onClick={() => onRemove(opt.id)}
              disabled={options.length <= 2}
              title={options.length <= 2 ? '至少需要2个选项' : '删除此选项'}
            >
              x
            </button>
          </div>
        ))}
      </div>
      <button
        className="add-option-btn"
        onClick={onAdd}
        disabled={options.length >= 12}
      >
        {options.length >= 12 ? '已达到最大数量（12个）' : '+ 添加选项'}
      </button>
    </div>
  );
}
