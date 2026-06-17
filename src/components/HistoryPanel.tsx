import React from 'react';
import { HistoryRecord } from '../types';

interface Props {
  history: HistoryRecord[];
  onClear: () => void;
}

export default function HistoryPanel({ history, onClear }: Props) {
  if (history.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📭</div>
        <p>暂无历史记录</p>
        <p style={{ marginTop: 4, fontSize: 12 }}>开始抽签后，结果会显示在这里</p>
      </div>
    );
  }

  return (
    <div>
      <div className="history-header">
        <span style={{ fontSize: 13, color: '#6a7a8c' }}>
          共 {history.length} 条记录
        </span>
        <button className="btn btn-danger" onClick={onClear} style={{ fontSize: 12, padding: '4px 10px' }}>
          清空
        </button>
      </div>
      <div className="history-list">
        {history.map((h, i) => (
          <div
            key={h.id}
            className="history-item"
            style={{
              borderColor: h.resultColor,
              opacity: 1 - i * 0.03,
            }}
          >
            <div className="history-color" style={{ background: h.resultColor }} />
            <div className="history-result">{h.result}</div>
            <div className="history-time">
              {formatTime(h.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
