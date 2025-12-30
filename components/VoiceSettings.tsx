
import React, { useState, useEffect, useRef } from 'react';
import { VoiceProfile, VoiceName, UserVoiceMemory, VoiceTrait, WorkspaceVoiceMemory } from '../types';

interface VoiceSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    profiles: VoiceProfile[];
    activeProfileId: string;
    onSelectProfile: (id: string) => void;
    onUpdateProfile: (id: string, updates: Partial<VoiceProfile>) => void;
    userName: string;
    onUpdateUserName: (name: string) => void;
    memory: UserVoiceMemory;
    transparencyStatement: string;
    onToggleLock: (trait: VoiceTrait) => void;
    activeWorkspace: WorkspaceVoiceMemory | undefined;
    availableWorkspaces: WorkspaceVoiceMemory[];
    onSetWorkspace: (id: string | null) => void;
    onWipeMemory: () => void;
}

// ... Tooltip, SectionHeader, ToggleGroup, SwitchControl components remain same as previous file ...
// Only SliderControl needs update to show DNA limits

const Tooltip: React.FC<{ title: string; content: string; technical?: string }> = ({ title, content, technical }) => {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: Event) => {
            if (tooltipRef.current && tooltipRef.current.contains(event.target as Node)) return;
            const target = event.target as HTMLElement;
            if (target.closest('.tooltip-trigger')) return;
            setIsVisible(false);
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        }
    }, [isVisible]);
    
    return (
        <div className="relative inline-flex items-center ml-2" ref={tooltipRef}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsVisible(!isVisible); }}
                className={`tooltip-trigger w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${isVisible ? 'border-skin-accent text-skin-accent bg-skin-accent/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-skin-muted/50 text-skin-muted hover:border-skin-text hover:text-skin-text'}`}
                aria-label="Info"
            >
                <span className="text-[9px] font-mono">i</span>
            </button>
            {isVisible && (
                <>
                    <div className="md:hidden fixed left-4 right-4 bottom-8 z-[200] animate-in slide-in-from-bottom-5 duration-200">
                        <div className="bg-[#050505]/95 backdrop-blur-xl p-5 rounded-2xl border border-skin-border shadow-[0_0_50px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                            <div className="flex justify-between items-start mb-3">
                                <h5 className="text-sm font-bold text-skin-text tracking-wide flex items-center gap-2">
                                    <span className="w-1 h-4 bg-skin-accent rounded-full"></span>
                                    {title}
                                </h5>
                                <button onClick={() => setIsVisible(false)} className="text-skin-muted p-1 hover:text-white">✕</button>
                            </div>
                            <p className="text-xs text-skin-text/80 leading-relaxed font-light mb-3">{content}</p>
                            {technical && (
                                <div className="pt-3 border-t border-white/5">
                                    <span className="text-[10px] text-skin-accent font-mono uppercase tracking-wider block mb-1">Config Impact</span>
                                    <p className="text-[10px] text-skin-muted font-mono">{technical}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-80 z-[200] animate-in fade-in zoom-in-95 duration-200 origin-bottom">
                         <div className="bg-[#09090b]/95 backdrop-blur-xl p-5 rounded-xl border border-skin-border shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                             <div className="flex justify-between items-start mb-3">
                                 <h5 className="text-sm font-bold text-skin-text tracking-wide">{title}</h5>
                             </div>
                             <p className="text-xs text-skin-text/80 leading-relaxed font-light mb-3">{content}</p>
                             {technical && (
                                 <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                     <span className="text-[9px] text-skin-accent font-mono uppercase tracking-wider block mb-1">Signal Processing</span>
                                     <p className="text-[10px] text-skin-muted font-mono leading-tight">{technical}</p>
                                 </div>
                             )}
                             <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#09090b] border-r border-b border-skin-border transform rotate-45"></div>
                         </div>
                    </div>
                </>
            )}
        </div>
    );
};

const SectionHeader: React.FC<{ title: string; subtitle?: string; color?: string }> = ({ title, subtitle, color = "bg-skin-accent" }) => (
    <div className="mb-6 pb-2 border-b border-white/5">
        <h4 className="text-sm font-bold text-skin-text flex items-center gap-2">
            <span className={`w-1.5 h-1.5 ${color} rounded-full shadow-glow`}></span>
            {title}
        </h4>
        {subtitle && <p className="text-[10px] text-skin-muted mt-1 ml-3.5 opacity-70">{subtitle}</p>}
    </div>
);

const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    displayValue: string | number;
    onChange: (val: number) => void;
    tooltip: { title: string; content: string; technical?: string };
    colorClass?: string;
    isLocked?: boolean;
    onToggleLock?: () => void;
    // DNA constraints visualization
    dnaMin?: number;
    dnaMax?: number;
}> = ({ label, value, min, max, step, displayValue, onChange, tooltip, colorClass = "from-skin-secondary to-skin-accent", isLocked, onToggleLock, dnaMin, dnaMax }) => {
    
    // Effective min/max for the slider input
    const effectiveMin = dnaMin !== undefined ? Math.max(min, dnaMin) : min;
    const effectiveMax = dnaMax !== undefined ? Math.min(max, dnaMax) : max;

    return (
        <div className="py-3 group relative">
            <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-skin-muted uppercase tracking-widest group-hover:text-skin-text transition-colors">{label}</span>
                    <Tooltip {...tooltip} />
                </div>
                <div className="flex items-center gap-3">
                    {onToggleLock && (
                        <button 
                            onClick={onToggleLock}
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border transition-all flex items-center gap-1 ${isLocked ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-transparent border-transparent text-skin-muted hover:text-skin-text hover:bg-white/5'}`}
                            title={isLocked ? "Learning Disabled" : "Learning Enabled"}
                        >
                            {isLocked ? (
                                <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg> LOCK</>
                            ) : (
                                <><svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> AUTO</>
                            )}
                        </button>
                    )}
                    <span className="font-mono text-[10px] font-bold text-skin-accent bg-skin-surface/80 px-2 py-1 rounded border border-skin-border min-w-[3.5rem] text-center">
                        {displayValue}
                    </span>
                </div>
            </div>
            
            {/* Range Track */}
            <div className={`relative h-2 flex items-center cursor-pointer touch-none select-none ${isLocked ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                <div className="absolute w-full h-1 bg-skin-surface rounded-full overflow-hidden border border-white/5">
                    {/* DNA Bounds Visualization (Grey out unsupported areas) */}
                    {(dnaMin !== undefined && dnaMax !== undefined) && (
                        <>
                            <div className="absolute top-0 bottom-0 bg-black/50 z-10" style={{ left: 0, width: `${((dnaMin - min) / (max - min)) * 100}%` }}></div>
                            <div className="absolute top-0 bottom-0 bg-black/50 z-10" style={{ right: 0, width: `${((max - dnaMax) / (max - min)) * 100}%` }}></div>
                        </>
                    )}
                    <div 
                        className={`h-full bg-gradient-to-r ${colorClass} opacity-80 group-hover:opacity-100 transition-all duration-200`}
                        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                    ></div>
                </div>
                <input 
                    type="range" min={effectiveMin} max={effectiveMax} step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    disabled={isLocked}
                />
                <div 
                    className="absolute w-4 h-4 bg-[#f8fafc] rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-skin-base transition-transform duration-100 pointer-events-none transform -translate-x-1/2 scale-75 group-hover:scale-100 group-active:scale-125 z-20"
                    style={{ left: `${((value - min) / (max - min)) * 100}%` }}
                ></div>
            </div>
            {isLocked && <div className="text-[9px] text-red-400/70 mt-1.5 flex items-center gap-1 font-mono"><span className="w-1 h-1 bg-red-400 rounded-full"></span> PERSISTENT OVERRIDE ACTIVE</div>}
            {(dnaMin !== undefined) && <div className="text-[9px] text-skin-muted mt-1 opacity-50 text-right w-full">DNA Bound: {dnaMin}-{dnaMax}</div>}
        </div>
    );
};

const ToggleGroup: React.FC<{
    label: string;
    options: string[];
    value: string;
    onChange: (val: string) => void;
    tooltip: { title: string; content: string; technical?: string };
}> = ({ label, options, value, onChange, tooltip }) => (
    <div className="py-2">
        <div className="flex items-center mb-3">
            <span className="text-[10px] font-bold text-skin-muted uppercase tracking-widest">{label}</span>
            <Tooltip {...tooltip} />
        </div>
        <div className="flex bg-[#050505] rounded-lg p-1 border border-white/10 h-8">
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`flex-1 text-[9px] uppercase font-bold rounded-md transition-all ${value === opt ? 'bg-skin-surface border border-skin-border text-skin-text shadow-sm' : 'text-skin-muted hover:text-skin-text hover:bg-white/5'}`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const SwitchControl: React.FC<{
    label: string;
    value: boolean;
    onChange: (val: boolean) => void;
    tooltip: { title: string; content: string; technical?: string };
    warning?: boolean;
}> = ({ label, value, onChange, tooltip, warning }) => (
    <div className="flex items-center justify-between py-2 group">
        <div className="flex items-center">
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${value ? 'text-skin-text' : 'text-skin-muted'}`}>{label}</span>
            <Tooltip {...tooltip} />
        </div>
        <button 
            onClick={() => onChange(!value)}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 border ${value ? (warning ? 'bg-orange-500/20 border-orange-500' : 'bg-skin-accent/20 border-skin-accent') : 'bg-black border-white/10'}`}
        >
            <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200 ${value ? (warning ? 'translate-x-4 bg-orange-400' : 'translate-x-4 bg-skin-accent') : 'bg-skin-muted'}`}></div>
        </button>
    </div>
);

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ 
    isOpen, onClose, profiles, activeProfileId, onSelectProfile, onUpdateProfile, 
    memory, transparencyStatement, onToggleLock, activeWorkspace, availableWorkspaces, onSetWorkspace, onWipeMemory
}) => {
    const [activeTab, setActiveTab] = useState<'tuner' | 'memory'>('tuner');

    if (!isOpen) return null;

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
    const dna = activeProfile.dna;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="glass-panel w-full h-[100dvh] md:h-[90vh] md:max-w-6xl md:rounded-2xl shadow-2xl flex flex-col border border-skin-border relative overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="px-4 py-4 md:px-6 border-b border-skin-border bg-[#09090b]/95 backdrop-blur-xl flex justify-between items-center shrink-0 z-20">
                    <h3 className="text-lg md:text-xl font-bold text-skin-text tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-skin-accent/5 rounded-lg border border-skin-accent/20 text-skin-accent">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        Nexus Signal Processor
                    </h3>
                    
                    <div className="flex bg-[#050505] p-1 rounded-lg border border-white/10">
                        <button 
                            onClick={() => setActiveTab('tuner')}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'tuner' ? 'bg-skin-surface text-skin-text shadow-sm border border-skin-border' : 'text-skin-muted hover:text-skin-text'}`}
                        >
                            Voice DNA
                        </button>
                        <button 
                            onClick={() => setActiveTab('memory')}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'memory' ? 'bg-skin-surface text-skin-text shadow-sm border border-skin-border' : 'text-skin-muted hover:text-skin-text'}`}
                        >
                            Neural Memory
                        </button>
                    </div>

                    <button onClick={onClose} className="p-2 -mr-2 text-skin-muted hover:text-white hover:bg-white/5 rounded-full transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative bg-[#020203]">
                    
                    {/* Sidebar: Profiles */}
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-[#050505] flex-shrink-0 flex flex-col z-10">
                        <div className="hidden md:block px-6 py-4 border-b border-white/5">
                            <h4 className="text-[10px] font-bold text-skin-muted uppercase tracking-widest">Base Persona</h4>
                        </div>
                        
                        <div className="p-4 md:p-0 overflow-x-auto md:overflow-y-auto custom-scrollbar flex md:flex-col gap-2 md:gap-0 h-auto md:h-full">
                            {profiles.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelectProfile(p.id)}
                                    className={`
                                        shrink-0 relative group overflow-hidden transition-all duration-300
                                        rounded-lg md:rounded-none border md:border-0 md:border-b md:border-white/5 text-left
                                        w-40 md:w-full p-3 md:p-4
                                        ${activeProfileId === p.id 
                                            ? 'bg-white/5 border-skin-accent md:border-b-white/5' 
                                            : 'bg-transparent border-white/10 md:border-transparent hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {activeProfileId === p.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-skin-accent hidden md:block shadow-[0_0_10px_#22d3ee]"></div>
                                    )}
                                    <div className={`font-bold text-xs mb-1 truncate pr-2 ${activeProfileId === p.id ? 'text-skin-accent' : 'text-skin-muted group-hover:text-skin-text'}`}>
                                        {p.name}
                                    </div>
                                    <div className="flex items-center justify-between">
                                         <div className="text-[9px] uppercase tracking-wider opacity-60 text-skin-muted font-mono">{p.voiceName}</div>
                                         {activeProfileId === p.id && (
                                             <div className="w-1.5 h-1.5 rounded-full bg-skin-accent animate-pulse shadow-glow"></div>
                                         )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-20 md:pb-10">

                        {activeTab === 'memory' && (
                            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {/* ... Memory UI (Unchanged) ... */}
                                <div className="p-6 bg-[#09090b] rounded-xl border border-white/10 shadow-xl">
                                    <h4 className="text-xs font-bold text-skin-muted uppercase tracking-widest mb-4">Context Scope</h4>
                                    <div className="flex flex-col gap-3">
                                        <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${!activeWorkspace ? 'bg-skin-accent/10 border-skin-accent' : 'bg-black border-white/10 hover:border-white/20'}`}>
                                            <input 
                                                type="radio" name="workspace" 
                                                checked={!activeWorkspace}
                                                onChange={() => onSetWorkspace(null)}
                                                className="mr-4 accent-skin-accent"
                                            />
                                            <div>
                                                <div className={`font-bold text-sm ${!activeWorkspace ? 'text-skin-accent' : 'text-white'}`}>Personal Memory</div>
                                                <div className="text-xs text-skin-muted mt-0.5">Adapts privately to your individual conversation history.</div>
                                            </div>
                                        </label>
                                        {availableWorkspaces.map(ws => (
                                            <label key={ws.id} className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${activeWorkspace?.id === ws.id ? 'bg-skin-accent/10 border-skin-accent' : 'bg-black border-white/10 hover:border-white/20'}`}>
                                                <input 
                                                    type="radio" name="workspace" 
                                                    checked={activeWorkspace?.id === ws.id}
                                                    onChange={() => onSetWorkspace(ws.id)}
                                                    className="mr-4 accent-skin-accent"
                                                />
                                                <div>
                                                    <div className={`font-bold text-sm ${activeWorkspace?.id === ws.id ? 'text-skin-accent' : 'text-white'}`}>{ws.name}</div>
                                                    <div className="text-xs text-skin-muted mt-0.5">{ws.description}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-indigo-950/30 to-black rounded-xl border border-indigo-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <svg className="w-16 h-16 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                                    </div>
                                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                                        Cognitive Model State
                                    </h4>
                                    <p className="text-sm text-skin-text leading-relaxed font-light font-mono">
                                        "{transparencyStatement}"
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-indigo-500/10 flex justify-between items-center">
                                        <span className="text-[10px] text-indigo-400/60 font-mono">
                                            LAST UPDATED: {new Date(memory.lastStableTimestamp).toLocaleTimeString()}
                                        </span>
                                        <button 
                                            onClick={onWipeMemory}
                                            className="text-[10px] font-bold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/50 bg-red-500/5 px-3 py-1.5 rounded transition-all uppercase tracking-wider"
                                        >
                                            Reset Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tuner' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                {/* Column 1: Signal Carrier (Core Voice) */}
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <SectionHeader title="Signal Carrier" subtitle="Fundamental vocal characteristics" color="bg-orange-500" />
                                    
                                    <div className="space-y-5">
                                        <SliderControl 
                                            label="Pace"
                                            value={activeProfile.pace} min={0.8} max={1.5} step={0.05} displayValue={`${activeProfile.pace.toFixed(2)}x`}
                                            onChange={(v) => onUpdateProfile(activeProfile.id, { pace: v })}
                                            tooltip={{
                                                title: "Speech Rate",
                                                content: "Controls the baseline playback speed. Constrained by Voice DNA to maintain intelligibility.",
                                                technical: "Modulates the duration of phonemes without altering pitch."
                                            }}
                                            colorClass="from-orange-500/50 to-red-500"
                                            isLocked={memory.lockedTraits.includes('pace')}
                                            onToggleLock={() => onToggleLock('pace')}
                                            dnaMin={dna?.paceRange[0]}
                                            dnaMax={dna?.paceRange[1]}
                                        />
                                        <SliderControl 
                                            label="Warmth"
                                            value={activeProfile.warmth} min={1} max={10} step={1} displayValue={`${activeProfile.warmth.toFixed(0)}/10`}
                                            onChange={(v) => onUpdateProfile(activeProfile.id, { warmth: v })}
                                            tooltip={{
                                                title: "Tonal Temperature",
                                                content: "Adjusts empathy and softness.",
                                                technical: "Affects formant shifting and pitch variance amplitude."
                                            }}
                                            colorClass="from-rose-500/50 to-pink-500"
                                            isLocked={memory.lockedTraits.includes('warmth')}
                                            onToggleLock={() => onToggleLock('warmth')}
                                            dnaMin={dna?.warmthRange[0]}
                                            dnaMax={dna?.warmthRange[1]}
                                        />
                                        <SliderControl 
                                            label="Energy"
                                            value={activeProfile.energy} min={1} max={10} step={1} displayValue={`${activeProfile.energy.toFixed(0)}/10`}
                                            onChange={(v) => onUpdateProfile(activeProfile.id, { energy: v })}
                                            tooltip={{
                                                title: "Dynamic Intensity",
                                                content: "Sets the excitement level.",
                                                technical: "Controls volume compression and attack/decay envelopes."
                                            }}
                                            colorClass="from-yellow-500/50 to-orange-500"
                                            dnaMin={dna?.energyRange[0]}
                                            dnaMax={dna?.energyRange[1]}
                                        />
                                        <SliderControl 
                                            label="Firmness"
                                            value={activeProfile.firmness} min={1} max={10} step={1} displayValue={`${activeProfile.firmness.toFixed(0)}/10`}
                                            onChange={(v) => onUpdateProfile(activeProfile.id, { firmness: v })}
                                            tooltip={{
                                                title: "Assertiveness",
                                                content: "Determines confidence level.",
                                                technical: "Reduces sentence-final pitch rise (upspeak)."
                                            }}
                                            colorClass="from-slate-500/50 to-white"
                                            isLocked={memory.lockedTraits.includes('firmness')}
                                            onToggleLock={() => onToggleLock('firmness')}
                                        />
                                    </div>
                                </div>

                                {/* Column 2: Cognitive & Bio-Acoustics */}
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                                    
                                    {/* Cognitive Flow */}
                                    <div className="space-y-6">
                                        <SectionHeader title="Cognitive Flow" subtitle="Thinking patterns & response shaping" color="bg-indigo-500" />
                                        
                                        <div className="space-y-5">
                                            <SliderControl 
                                                label="Brevity"
                                                value={activeProfile.brevity} min={1} max={10} step={1} displayValue={`${activeProfile.brevity.toFixed(0)}/10`}
                                                onChange={(v) => onUpdateProfile(activeProfile.id, { brevity: v })}
                                                tooltip={{
                                                    title: "Conciseness",
                                                    content: "Higher values force efficient, dense communication.",
                                                    technical: "Adjusts token budget penalty for length."
                                                }}
                                                colorClass="from-blue-500/50 to-indigo-500"
                                                isLocked={memory.lockedTraits.includes('brevity')}
                                                onToggleLock={() => onToggleLock('brevity')}
                                            />
                                            
                                            <ToggleGroup 
                                                label="Thought Delay" 
                                                options={['off', 'short', 'variable']} 
                                                value={activeProfile.thoughtDelay} 
                                                onChange={(v) => onUpdateProfile(activeProfile.id, { thoughtDelay: v as any })} 
                                                tooltip={{
                                                    title: "Simulated Latency",
                                                    content: "Inserts a pause before responding to complex queries.",
                                                    technical: "Adds randomized pre-response silence."
                                                }}
                                            />

                                            <SwitchControl 
                                                label="Emotional Drift" 
                                                value={activeProfile.emotionalDrift} 
                                                onChange={(v) => onUpdateProfile(activeProfile.id, { emotionalDrift: v })} 
                                                tooltip={{
                                                    title: "Sentiment Adaptation",
                                                    content: "Allows voice tone to gradually shift based on the user's detected mood.",
                                                    technical: "Enables real-time sentiment analysis feedback loop."
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Bio-Acoustics (Human Realism) */}
                                    <div className="space-y-6">
                                        <SectionHeader title="Bio-Acoustics" subtitle="NotebookLM-style human imperfections" color="bg-emerald-500" />
                                        
                                        <div className="space-y-2">
                                            <ToggleGroup 
                                                label="Micro-Hesitations" 
                                                options={['off', 'low', 'natural']} 
                                                value={activeProfile.microHesitation} 
                                                onChange={(v) => onUpdateProfile(activeProfile.id, { microHesitation: v as any })} 
                                                tooltip={{
                                                    title: "Disfluency Injection",
                                                    content: "Adds subtle stutters or pauses mid-sentence.",
                                                    technical: "Probabilistic insertion of silence tokens."
                                                }}
                                            />
                                            
                                            <ToggleGroup 
                                                label="Natural Fillers" 
                                                options={['off', 'rare', 'contextual']} 
                                                value={activeProfile.naturalFillers} 
                                                onChange={(v) => onUpdateProfile(activeProfile.id, { naturalFillers: v as any })} 
                                                tooltip={{
                                                    title: "Filler Words",
                                                    content: "Inserts 'um', 'uh', 'you know'.",
                                                    technical: "Conversational filler injection model."
                                                }}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <SwitchControl 
                                                    label="Self-Correction" 
                                                    value={activeProfile.selfCorrection} 
                                                    onChange={(v) => onUpdateProfile(activeProfile.id, { selfCorrection: v })} 
                                                    tooltip={{
                                                        title: "Reformulation",
                                                        content: "Occasionally restarts a sentence to clarify meaning.",
                                                        technical: "Simulates false starts."
                                                    }}
                                                />
                                                <SwitchControl 
                                                    label="Breath Sounds" 
                                                    value={activeProfile.breathPlacement === 'subtle'} 
                                                    onChange={(v) => onUpdateProfile(activeProfile.id, { breathPlacement: v ? 'subtle' : 'off' })} 
                                                    tooltip={{
                                                        title: "Inhalation Cues",
                                                        content: "Adds soft breath sounds before long sentences.",
                                                        technical: "Inserts low-volume aspiration noise."
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
