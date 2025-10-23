import React, { useState, useEffect } from 'react';
import './TrajectoryVisualization.css';

export default function TrajectoryVisualization() {
  const [allData, setAllData] = useState([]);
  const [currentTrajectory, setCurrentTrajectory] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepInput, setStepInput] = useState('1');
  
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedEnv, setSelectedEnv] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedRunId, setSelectedRunId] = useState('all');
  
  const [models, setModels] = useState([]);
  const [envs, setEnvs] = useState([]);
  const [levels, setLevels] = useState([]);
  const [runIds, setRunIds] = useState([]);

  const [availableModels, setAvailableModels] = useState([]);
  const [availableEnvs, setAvailableEnvs] = useState([]);
  const [availableLevels, setAvailableLevels] = useState([]);
  const [availableRunIds, setAvailableRunIds] = useState([]);

  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setTimeout(() => {
      if (currentStepIndex < currentTrajectory.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        setIsPlaying(false);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, currentTrajectory.length]);

  useEffect(() => {
    setStepInput(String(currentStepIndex + 1));
  }, [currentStepIndex]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const cleanedText = text.replace(/:\s*NaN/g, ': null');
      const parsed = JSON.parse(cleanedText);
      
      setAllData(parsed);
      
      const uniqueModels = [...new Set(parsed.map(r => r.model))].filter(Boolean);
      const uniqueEnvs = [...new Set(parsed.map(r => r.env))].filter(Boolean);
      const uniqueLevels = [...new Set(parsed.map(r => r.level))].filter(Boolean);
      const uniqueRunIds = [...new Set(parsed.map(r => r.run_id))].filter(Boolean).sort((a, b) => {
        return String(a).localeCompare(String(b));
      });
      
      setModels(uniqueModels);
      setEnvs(uniqueEnvs);
      setLevels(uniqueLevels);
      setRunIds(uniqueRunIds);
      
      setAvailableModels(uniqueModels);
      setAvailableEnvs(uniqueEnvs);
      setAvailableLevels(uniqueLevels);
      setAvailableRunIds(uniqueRunIds);
      
      setSelectedModel('all');
      setSelectedEnv('all');
      setSelectedLevel('all');
      setSelectedRunId(uniqueRunIds.length > 0 ? uniqueRunIds[0] : 'all');
      setCurrentStepIndex(0);
      setIsPlaying(false);
      
      event.target.value = '';
    } catch (error) {
      alert('Error loading file: ' + error.message);
    }
  };

  useEffect(() => {
    if (allData.length === 0) return;

    let filtered = [...allData];
    
    if (selectedModel !== 'all') {
      filtered = filtered.filter(r => String(r.model) === String(selectedModel));
    }
    if (selectedEnv !== 'all') {
      filtered = filtered.filter(r => String(r.env) === String(selectedEnv));
    }
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(r => String(r.level) === String(selectedLevel));
    }
    if (selectedRunId !== 'all') {
      filtered = filtered.filter(r => String(r.run_id) === String(selectedRunId));
    }

    const newAvailableModels = [...new Set(filtered.map(r => r.model))];
    const newAvailableEnvs = [...new Set(filtered.map(r => r.env))];
    const newAvailableLevels = [...new Set(filtered.map(r => r.level))];
    const newAvailableRunIds = [...new Set(filtered.map(r => r.run_id))].sort((a, b) => {
      return String(a).localeCompare(String(b));
    });

    if (selectedModel !== 'all' && !newAvailableModels.some(m => String(m) === String(selectedModel))) {
      setSelectedModel('all');
      return;
    }
    if (selectedEnv !== 'all' && !newAvailableEnvs.some(e => String(e) === String(selectedEnv))) {
      setSelectedEnv('all');
      return;
    }
    if (selectedLevel !== 'all' && !newAvailableLevels.some(l => String(l) === String(selectedLevel))) {
      setSelectedLevel('all');
      return;
    }
    if (selectedRunId !== 'all' && !newAvailableRunIds.some(id => String(id) === String(selectedRunId))) {
      setSelectedRunId('all');
      return;
    }

    setAvailableModels(newAvailableModels);
    setAvailableEnvs(newAvailableEnvs);
    setAvailableLevels(newAvailableLevels);
    setAvailableRunIds(newAvailableRunIds);

    const orderMap = {};
    let idx = 0;
    for (const r of allData) {
      const key = `${r.model || ''}|||${r.env || ''}|||${r.level || ''}|||${r.run_id || ''}`;
      if (!(key in orderMap)) orderMap[key] = idx++;
    }

    filtered.sort((a, b) => {
      const keyA = `${a.model || ''}|||${a.env || ''}|||${a.level || ''}|||${a.run_id || ''}`;
      const keyB = `${b.model || ''}|||${b.env || ''}|||${b.level || ''}|||${b.run_id || ''}`;

      const groupCompare = (orderMap[keyA] || 0) - (orderMap[keyB] || 0);
      if (groupCompare !== 0) return groupCompare;

      return (Number(a.step) || 0) - (Number(b.step) || 0);
    });
;
    
    setCurrentTrajectory(filtered);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [allData, selectedModel, selectedEnv, selectedLevel, selectedRunId]);

  const currentStep = currentTrajectory[currentStepIndex] || {};

  const nextStep = () => {
    if (currentStepIndex < currentTrajectory.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const togglePlayPause = () => {
    if (currentStepIndex === currentTrajectory.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const resetAllFilters = () => {
    setSelectedModel('all');
    setSelectedEnv('all');
    setSelectedLevel('all');
    setSelectedRunId('all');
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleStepInputChange = (e) => {
    setStepInput(e.target.value);
  };

  const handleStepInputSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const num = parseInt(stepInput);
      if (!isNaN(num) && num >= 1 && num <= currentTrajectory.length) {
        setCurrentStepIndex(num - 1);
        setIsPlaying(false);
      } else {
        setStepInput(String(currentStepIndex + 1));
      }
    }
  };

  return (
    <div className="trajectory-app">
      <div className="app-container">
        <div className="app-header">
          <h1 className="app-title">Tales Trajectory Visualization</h1>
          <p className="app-subtitle">AI agent decision-making trajectories step by step</p>
        </div>

        {allData.length === 0 && (
          <div className="upload-section">
            <div className="upload-icon">📁</div>
            <label className="upload-label">
              Upload JSON File
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="upload-input"
              />
            </label>
            <p className="upload-hint">Support .json format trajectory data</p>
          </div>
        )}

        {allData.length > 0 && (
          <>
            <div className="filters-section">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem'}}>
                <h2 className="filters-title" style={{margin: 0}}>🔍 Filters</h2>
                <label style={{
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'background 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  📁 Change File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    style={{display: 'none'}}
                  />
                </label>
              </div>
              
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Model</label>
                  <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="filter-select">
                    <option value="all">All Models</option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Environment</label>
                  <select value={selectedEnv} onChange={(e) => setSelectedEnv(e.target.value)} className="filter-select">
                    <option value="all">All Environments</option>
                    {availableEnvs.map(env => (
                      <option key={env} value={env}>{env}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Level</label>
                  <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="filter-select">
                    <option value="all">All Levels</option>
                    {availableLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Run ID</label>
                  <select value={String(selectedRunId)} onChange={(e) => setSelectedRunId(e.target.value)} className="filter-select">
                    <option value="all">All Runs</option>
                    {runIds.map(id => (
                      <option key={id} value={String(id)}>{id}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="filters-footer">
                <div className="filter-info">
                  Current Trajectory: <span>{currentTrajectory.length}</span> steps
                </div>
                <button onClick={resetAllFilters} className="reset-btn">
                  ↻ Reset Filters
                </button>
              </div>
            </div>

            {currentTrajectory.length > 0 ? (
              <>
                <div className="metadata-bar">
                  <div className="metadata-grid">
                    <div>
                      <div className="metadata-item-label">Model</div>
                      <div className="metadata-item-value">{currentStep.model || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="metadata-item-label">Environment</div>
                      <div className="metadata-item-value">{currentStep.env || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="metadata-item-label">Level</div>
                      <div className="metadata-item-value">{currentStep.level || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="metadata-item-label">Run ID</div>
                      <div className="metadata-item-value">{currentStep.run_id || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="metadata-item-label">Step</div>
                      <div className="metadata-item-value">{currentStep.step !== undefined ? currentStep.step : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="navigation-card">
                  <div className="nav-buttons">
                    <button onClick={prevStep} disabled={currentStepIndex === 0} className="nav-btn nav-btn-prev">
                      ← Previous Step
                    </button>

                    <button onClick={togglePlayPause} className="nav-btn nav-btn-play">
                      {isPlaying ? '⏸ Pause' : '▶ Auto Play'}
                    </button>

                    <button onClick={nextStep} disabled={currentStepIndex === currentTrajectory.length - 1} className="nav-btn nav-btn-next">
                      Next Step →
                    </button>
                  </div>

                  <div className="step-counter">
                    <div className="step-counter-main" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                      <span>Step</span>
                      <input
                        type="number"
                        value={stepInput}
                        onChange={handleStepInputChange}
                        onKeyDown={handleStepInputSubmit}
                        onBlur={handleStepInputSubmit}
                        min="1"
                        max={currentTrajectory.length}
                        style={{
                          width: '80px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          background: '#374151',
                          border: '2px solid #4b5563',
                          borderRadius: '0.5rem',
                          color: 'white'
                        }}
                      />
                      <span>/ {currentTrajectory.length}</span>
                    </div>
                    <div className="step-counter-sub">
                      Use navigation buttons, auto play, or enter a step number to browse
                    </div>
                  </div>

                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${((currentStepIndex + 1) / currentTrajectory.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title">👁️ Observation Before</h3>
                  <div className="card-content">
                    <p className="card-text">{currentStep.observation_before || "No observation data"}</p>
                  </div>
                </div>

                <div className="action-card">
                  <h3 className="card-title">⚡ Action</h3>
                  <div className="card-content">
                    <p className="action-text">{currentStep.action || "No action"}</p>
                  </div>
                </div>

                <div className="reasoning-card">
                  <h3 className="card-title">🧠 AI Reasoning</h3>
                  <div className="card-content">
                    <div id="ai-reasoning-container">
                      <p className="reasoning-placeholder">
                        AI reasoning tools to populate content
                      </p>
                    </div>
                  </div>
                  <div className="reasoning-note">
                    Mindcoder
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title">📊 Observation After</h3>
                  <div className="card-content">
                    <p className="card-text">{currentStep.observation_after || "No observation data"}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-data">
                <p className="no-data-title">No data matches the selected filters</p>
                <p className="no-data-subtitle">Please adjust your filter selections</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}