import React, { useState, useEffect, useCallback } from 'react';
import {
  WheelScheme,
  WheelOption,
  HistoryRecord,
  DrawMode,
} from './types';
import {
  loadSchemes,
  saveSchemes,
  loadHistory,
  saveHistory,
  loadActiveSchemeId,
  saveActiveSchemeId,
  generateId,
  getDefaultColor,
  createDefaultScheme,
} from './storage';
import WheelCanvas from './components/WheelCanvas';
import DrawTube from './components/DrawTube';
import DiceMode from './components/DiceMode';
import OptionEditor from './components/OptionEditor';
import HistoryPanel from './components/HistoryPanel';

export default function App() {
  const [schemes, setSchemes] = useState<WheelScheme[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [mode, setMode] = useState<DrawMode>('wheel');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ text: string; color: string } | null>(null);
  const [rightTab, setRightTab] = useState<'history' | 'stats'>('history');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    let loadedSchemes = loadSchemes();
    if (loadedSchemes.length === 0) {
      const def = createDefaultScheme();
      loadedSchemes = [def];
      saveSchemes(loadedSchemes);
    }
    setSchemes(loadedSchemes);
    const savedActive = loadActiveSchemeId();
    if (savedActive && loadedSchemes.find(s => s.id === savedActive)) {
      setActiveId(savedActive);
    } else {
      setActiveId(loadedSchemes[0].id);
    }
    setHistory(loadHistory());
  }, []);

  const activeScheme = schemes.find(s => s.id === activeId) || schemes[0];

  // Sync mode from active scheme
  useEffect(() => {
    if (activeScheme) {
      setMode(activeScheme.mode);
    }
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateScheme = useCallback((updater: (s: WheelScheme) => WheelScheme) => {
    setSchemes(prev => {
      const next = prev.map(s => s.id === activeId ? updater(s) : s);
      saveSchemes(next);
      return next;
    });
  }, [activeId]);

  const handleModeChange = useCallback((newMode: DrawMode) => {
    setMode(newMode);
    setResult(null);
    setHighlightId(null);
    setSchemes(prev => {
      const next = prev.map(s => s.id === activeId ? { ...s, mode: newMode } : s);
      saveSchemes(next);
      return next;
    });
  }, [activeId]);

  const handleActiveChange = useCallback((id: string) => {
    setActiveId(id);
    saveActiveSchemeId(id);
    setResult(null);
    setHighlightId(null);
  }, []);

  const addOption = useCallback(() => {
    if (!activeScheme || activeScheme.options.length >= 12) return;
    const idx = activeScheme.options.length;
    const newOpt: WheelOption = {
      id: generateId(),
      text: `选项${idx + 1}`,
      color: getDefaultColor(idx),
    };
    updateScheme(s => ({ ...s, options: [...s.options, newOpt] }));
  }, [activeScheme, updateScheme]);

  const removeOption = useCallback((optId: string) => {
    if (!activeScheme || activeScheme.options.length <= 2) return;
    updateScheme(s => ({ ...s, options: s.options.filter(o => o.id !== optId) }));
  }, [activeScheme, updateScheme]);

  const updateOption = useCallback((optId: string, field: 'text' | 'color', value: string) => {
    updateScheme(s => ({
      ...s,
      options: s.options.map(o => o.id === optId ? { ...o, [field]: value } : o),
    }));
  }, [updateScheme]);

  const handleDrawResult = useCallback((text: string, color: string) => {
    setResult({ text, color });
    setSpinning(false);
    const record: HistoryRecord = {
      id: generateId(),
      schemeId: activeId,
      schemeName: activeScheme?.name || '未知',
      result: text,
      resultColor: color,
      mode,
      timestamp: Date.now(),
    };
    setHistory(prev => {
      const next = [record, ...prev];
      saveHistory(next);
      return next;
    });
  }, [activeId, activeScheme, mode]);

  const handleStart = useCallback(() => {
    if (!activeScheme || activeScheme.options.length < 2) return;
    setSpinning(true);
    setResult(null);
    setHighlightId(null);
  }, [activeScheme]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const handleSaveAsNew = useCallback(() => {
    if (!saveName.trim() || !activeScheme) return;
    const newScheme: WheelScheme = {
      ...activeScheme,
      id: generateId(),
      name: saveName.trim(),
      options: activeScheme.options.map(o => ({ ...o, id: generateId() })),
    };
    setSchemes(prev => {
      const next = [...prev, newScheme];
      saveSchemes(next);
      return next;
    });
    setActiveId(newScheme.id);
    saveActiveSchemeId(newScheme.id);
    setShowSaveModal(false);
    setSaveName('');
  }, [saveName, activeScheme]);

  const handleDeleteScheme = useCallback((id: string) => {
    if (schemes.length <= 1) return;
    const remaining = schemes.filter(s => s.id !== id);
    setSchemes(remaining);
    saveSchemes(remaining);
    if (activeId === id) {
      setActiveId(remaining[0].id);
      saveActiveSchemeId(remaining[0].id);
    }
    setShowDeleteConfirm(null);
  }, [schemes, activeId]);

  const stats = React.useMemo(() => {
    if (!activeScheme) return {};
    const counts: Record<string, number> = {};
    activeScheme.options.forEach(o => { counts[o.text] = 0; });
    history.filter(h => h.schemeId === activeId).forEach(h => {
      counts[h.result] = (counts[h.result] || 0) + 1;
    });
    return counts;
  }, [history, activeId, activeScheme]);

  const maxCount = Math.max(1, ...Object.values(stats));

  if (!activeScheme) return null;

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <h1>在线抽签转盘</h1>
        <p className="subtitle">随机选择，让决定更有趣</p>
      </div>

      {/* Mode tabs */}
      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'wheel' ? 'active' : ''}`}
          onClick={() => handleModeChange('wheel')}
        >
          转盘
        </button>
        <button
          className={`mode-tab ${mode === 'tube' ? 'active' : ''}`}
          onClick={() => handleModeChange('tube')}
        >
          抽签筒
        </button>
        <button
          className={`mode-tab ${mode === 'dice' ? 'active' : ''}`}
          onClick={() => handleModeChange('dice')}
        >
          骰子
        </button>
      </div>

      {/* Main layout */}
      <div className="main-layout">
        {/* Left panel */}
        <div>
          {/* Scheme selector */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-title">
              <span className="icon">📋</span> 方案管理
            </div>
            <div className="scheme-bar">
              <select
                value={activeId}
                onChange={e => handleActiveChange(e.target.value)}
              >
                {schemes.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => setShowSaveModal(true)}>
                另存
              </button>
              {schemes.length > 1 && (
                <button
                  className="btn btn-danger"
                  onClick={() => setShowDeleteConfirm(activeId)}
                >
                  删除
                </button>
              )}
            </div>
          </div>

          {/* Option editor */}
          <div className="panel">
            <div className="panel-title">
              <span className="icon">✏️</span> 选项编辑
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6a7a8c' }}>
                {activeScheme.options.length}/12
              </span>
            </div>
            <OptionEditor
              options={activeScheme.options}
              onAdd={addOption}
              onRemove={removeOption}
              onUpdate={updateOption}
            />
          </div>
        </div>

        {/* Right area */}
        <div>
          {/* Mode area */}
          <div className="panel">
            {mode === 'wheel' && (
              <div className="wheel-area">
                <WheelCanvas
                  options={activeScheme.options}
                  spinning={spinning}
                  onResult={handleDrawResult}
                  highlightOptionId={highlightId}
                />
                <button
                  className="spin-btn"
                  onClick={handleStart}
                  disabled={spinning || activeScheme.options.length < 2}
                >
                  {spinning ? '旋转中...' : '开始'}
                </button>
              </div>
            )}
            {mode === 'tube' && (
              <div className="tube-area">
                <DrawTube
                  options={activeScheme.options}
                  spinning={spinning}
                  onResult={(text, color) => {
                    handleDrawResult(text, color);
                    const opt = activeScheme.options.find(o => o.text === text);
                    if (opt) setHighlightId(opt.id);
                  }}
                />
                <button
                  className="spin-btn"
                  onClick={handleStart}
                  disabled={spinning || activeScheme.options.length < 2}
                >
                  {spinning ? '摇签中...' : '抽签'}
                </button>
              </div>
            )}
            {mode === 'dice' && (
              <div className="dice-area">
                <DiceMode
                  options={activeScheme.options}
                  spinning={spinning}
                  onResult={(text, color) => {
                    handleDrawResult(text, color);
                    const opt = activeScheme.options.find(o => o.text === text);
                    if (opt) setHighlightId(opt.id);
                  }}
                  highlightOptionId={highlightId}
                />
                <button
                  className="spin-btn"
                  onClick={handleStart}
                  disabled={spinning || activeScheme.options.length < 2}
                >
                  {spinning ? '掷骰中...' : '掷骰子'}
                </button>
              </div>
            )}

            {/* Result display */}
            <div className="result-display">
              {result && (
                <div className="result-text" style={{ color: result.color }}>
                  {result.text}
                </div>
              )}
            </div>
          </div>

          {/* History and Stats */}
          <div className="history-section">
            <div className="panel">
              <div className="right-tabs">
                <button
                  className={`right-tab ${rightTab === 'history' ? 'active' : ''}`}
                  onClick={() => setRightTab('history')}
                >
                  历史记录
                </button>
                <button
                  className={`right-tab ${rightTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setRightTab('stats')}
                >
                  统计分析
                </button>
              </div>

              {rightTab === 'history' && (
                <HistoryPanel
                  history={history.filter(h => h.schemeId === activeId)}
                  onClear={clearHistory}
                />
              )}

              {rightTab === 'stats' && (
                <div>
                  {activeScheme.options.length === 0 ? (
                    <div className="empty-state">
                      <p>暂无数据</p>
                    </div>
                  ) : (
                    <div className="stats-grid">
                      {activeScheme.options.map(opt => (
                        <div key={opt.id} className="stat-card" style={{ borderColor: opt.color + '30' }}>
                          <div className="stat-label" title={opt.text}>{opt.text}</div>
                          <div className="stat-value" style={{ color: opt.color }}>
                            {stats[opt.text] || 0}
                          </div>
                          <div className="stat-bar">
                            <div
                              className="stat-bar-fill"
                              style={{
                                width: `${((stats[opt.text] || 0) / maxCount) * 100}%`,
                                background: opt.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>保存为新方案</h3>
            <input
              className="modal-input"
              placeholder="输入方案名称..."
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveAsNew()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveAsNew}
                disabled={!saveName.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <p>确定要删除这个方案吗？此操作不可撤销。</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteScheme(showDeleteConfirm)}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
