
import React from 'react';
import { HostConfig, VoiceName } from '../../types';

interface HostTunerProps {
    config: HostConfig;
    onChange: (cfg: HostConfig) => void;
}

const VOICES: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Orus', 'Aoede'];

export const HostTuner: React.FC<HostTunerProps> = ({ config, onChange }) => {
    
    const update = (key: keyof HostConfig, val: any) => {
        onChange({ ...config, [key]: val });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Host Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-skin-muted uppercase tracking-widest">Primary Host Voice</label>
                    <div className="flex flex-wrap gap-2">
                        {VOICES.map(v => (
                            <button
                                key={v}
                                onClick={() => update('voiceName', v)}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${config.voiceName === v ? 'bg-skin-accent text-skin-base shadow-lg' : 'bg-skin-surface border border-skin-border text-skin-muted hover:text-skin-text'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-skin-muted uppercase tracking-widest">Host Persona</label>
                    <div className="flex flex-wrap gap-2">
                        {['Professional', 'Energetic', 'Empathetic', 'Socratic'].map(p => (
                            <button
                                key={p}
                                onClick={() => update('personality', p)}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${config.personality === p ? 'bg-skin-secondary text-skin-base shadow-lg' : 'bg-skin-surface border border-skin-border text-skin-muted hover:text-skin-text'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Structure Toggle */}
            <div className="p-4 bg-skin-base/30 rounded-xl border border-skin-border flex items-center justify-between">
                <div>
                    <div className="text-sm font-bold text-skin-text">Dual-Host Dynamic</div>
                    <div className="text-xs text-skin-muted">Enable a second voice (Expert) for conversational depth.</div>
                </div>
                <button 
                    onClick={() => update('dualHost', !config.dualHost)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${config.dualHost ? 'bg-skin-accent' : 'bg-skin-surface border border-skin-border'}`}
                >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.dualHost ? 'translate-x-6' : ''}`}></div>
                </button>
            </div>

            {/* Advanced Sliders */}
            <div className="space-y-4 pt-2 border-t border-skin-border/50">
                <h4 className="text-xs font-bold text-skin-muted uppercase tracking-widest mb-4">Voice DNA Fine-Tuning</h4>
                
                {/* Pace */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-xs text-skin-text">Speaking Pace</span>
                        <span className="text-xs text-skin-accent font-mono">{config.pace.toFixed(2)}x</span>
                    </div>
                    <input 
                        type="range" min="0.8" max="1.2" step="0.05"
                        value={config.pace}
                        onChange={(e) => update('pace', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-skin-surface rounded-full appearance-none cursor-pointer accent-skin-accent"
                    />
                </div>

                {/* Warmth */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-xs text-skin-text">Warmth & Empathy</span>
                        <span className="text-xs text-skin-accent font-mono">{config.warmth}/10</span>
                    </div>
                    <input 
                        type="range" min="1" max="10" step="1"
                        value={config.warmth}
                        onChange={(e) => update('warmth', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-skin-surface rounded-full appearance-none cursor-pointer accent-skin-accent"
                    />
                </div>

                {/* Imperfections */}
                <div className="space-y-2">
                    <label className="text-xs text-skin-text block">Human Imperfections</label>
                    <div className="flex gap-2 bg-skin-surface p-1 rounded-lg">
                        {['off', 'low', 'high'].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => update('imperfections', lvl)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all ${config.imperfections === lvl ? 'bg-skin-accent-dim text-skin-accent' : 'text-skin-muted hover:text-skin-text'}`}
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-skin-muted">Controls fillers (um, uh) and natural pauses.</p>
                </div>
            </div>
        </div>
    );
};
