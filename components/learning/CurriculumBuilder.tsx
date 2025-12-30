
import React, { useState } from 'react';
import { LearningSource, PodcastEpisode, TeachingMap, PodcastType, HostConfig } from '../../types';
import { useLearningAI } from '../../hooks/useLearningAI';
import { HostTuner } from './HostTuner';

interface PodcastGeneratorProps {
  sources: LearningSource[];
  onPodcastGenerated: (episode: PodcastEpisode) => void;
  onCancel: () => void;
}

export const CurriculumBuilder: React.FC<PodcastGeneratorProps> = ({ sources, onPodcastGenerated, onCancel }) => {
  const { isGenerating, generateTeachingMap, generatePodcastScript, synthesizePodcastAudio, generateCoverImage } = useLearningAI();
  
  // --- STATE ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Config, 2: Map, 3: Studio, 4: Generating
  
  // 1. Config
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<PodcastType>('Teaching');
  const [audience, setAudience] = useState('Beginner');
  
  // 2. Map (Intelligence Layer)
  const [teachingMap, setTeachingMap] = useState<TeachingMap | null>(null);
  
  // 3. Studio (Host Config)
  const [hostConfig, setHostConfig] = useState<HostConfig>({
      voiceName: 'Kore',
      personality: 'Professional',
      pace: 1.0,
      warmth: 7,
      imperfections: 'low',
      dualHost: true,
      audienceMode: 'off'
  });

  // 4. Generation Progress
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // --- ACTIONS ---

  const handleCreateMap = async () => {
      if (!topic) return;
      setError(null);
      setStatus('Analyzing sources & building teaching map...');
      
      const map = await generateTeachingMap(topic, audience, sources);
      if (map) {
          setTeachingMap(map);
          setStep(2);
      } else {
          setError("Failed to generate teaching map. Try simplifying the topic.");
      }
      setStatus('');
  };

  const handleSkipMap = () => {
      setTeachingMap(null);
      setStep(3); // Go straight to studio
  };

  const handleFinalize = async () => {
      setStep(4);
      setError(null);
      
      try {
          // 1. Scripting
          setStatus('Writing script (incorporating host persona & audience Q&A)...');
          const scriptResult = await generatePodcastScript(topic, mode, sources, hostConfig, teachingMap || undefined);
          
          if (!scriptResult) throw new Error("Script generation failed.");

          // 2. Assets (Parallel)
          setStatus('Designing cover art...');
          const imagePromise = generateCoverImage(topic, mode === 'Teaching' ? 'Minimalist' : 'Vibrant');
          
          // 3. Audio
          setStatus('Recording audio (this takes time)...');
          const audioData = await synthesizePodcastAudio(scriptResult.script, hostConfig, (pct) => {
              setStatus(`Synthesizing Audio: ${pct}%`);
          });

          const imageData = await imagePromise;

          // 4. Final Assembly
          const episode: PodcastEpisode = {
              id: Date.now().toString(),
              title: scriptResult.title,
              topic,
              type: mode,
              style: hostConfig.personality,
              script: scriptResult.script,
              teachingMap: teachingMap || undefined,
              hostConfig,
              sourceIds: sources.map(s => s.id),
              audioBase64: audioData || undefined,
              coverImageBase64: imageData || undefined,
              createdAt: new Date(),
              durationSeconds: 0 // Will be calculated by player
          };

          onPodcastGenerated(episode);

      } catch (e) {
          console.error(e);
          setError("Production failed. Please try again.");
          setStep(3); // Go back to studio to retry
          setStatus('');
      }
  };

  return (
    <div className="glass-panel w-full max-w-4xl mx-auto rounded-2xl border border-skin-border overflow-hidden flex flex-col h-[80vh] animate-in fade-in slide-in-from-bottom-4">
        
        {/* Step Indicator */}
        <div className="bg-skin-surface border-b border-skin-border p-4 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-bold text-skin-text uppercase tracking-widest">Podcast Studio</h2>
            <div className="flex gap-2">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`w-2 h-2 rounded-full transition-colors ${step >= s ? 'bg-skin-accent' : 'bg-skin-border'}`}></div>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
            
            {/* STEP 1: STRATEGY */}
            {step === 1 && (
                <div className="space-y-8 max-w-2xl mx-auto">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-skin-text mb-2">Content Strategy</h3>
                        <p className="text-skin-muted text-sm">Define the scope and style of your episode.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-skin-muted uppercase tracking-widest mb-2">Topic</label>
                            <textarea 
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                className="w-full h-24 glass-input rounded-xl px-4 py-3 text-skin-text focus:ring-1 focus:ring-skin-accent"
                                placeholder="What should we teach? e.g., 'Explain the Q3 Safety Protocols'..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => setMode('Teaching')}
                                className={`p-4 rounded-xl border text-left transition-all ${mode === 'Teaching' ? 'bg-skin-accent-dim border-skin-accent' : 'bg-skin-base border-skin-border hover:border-skin-muted'}`}
                            >
                                <div className="text-sm font-bold text-skin-text mb-1">Teaching Mode</div>
                                <div className="text-xs text-skin-muted">Structured learning with definitions, examples, and checkpoints.</div>
                            </button>
                            <button 
                                onClick={() => setMode('Standard')}
                                className={`p-4 rounded-xl border text-left transition-all ${mode === 'Standard' ? 'bg-skin-secondary/20 border-skin-secondary' : 'bg-skin-base border-skin-border hover:border-skin-muted'}`}
                            >
                                <div className="text-sm font-bold text-skin-text mb-1">Standard Podcast</div>
                                <div className="text-xs text-skin-muted">Conversational deep-dive into the sources. Narrative focus.</div>
                            </button>
                        </div>

                        {mode === 'Teaching' && (
                            <div>
                                <label className="block text-xs font-bold text-skin-muted uppercase tracking-widest mb-2">Target Audience</label>
                                <div className="flex gap-2">
                                    {['Beginner', 'Intermediate', 'Expert'].map(a => (
                                        <button 
                                            key={a}
                                            onClick={() => setAudience(a)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${audience === a ? 'bg-skin-text text-skin-base' : 'bg-skin-surface border border-skin-border text-skin-muted'}`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-between">
                        <button onClick={onCancel} className="text-skin-muted hover:text-skin-text text-sm">Cancel</button>
                        <button 
                            onClick={mode === 'Teaching' ? handleCreateMap : handleSkipMap}
                            disabled={!topic || isGenerating}
                            className="btn-glow px-8 py-3 rounded-xl text-white font-bold text-sm tracking-wide disabled:opacity-50"
                        >
                            {isGenerating ? "ANALYZING..." : "NEXT STEP"}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: TEACHING MAP (Review) */}
            {step === 2 && teachingMap && (
                <div className="space-y-6 max-w-3xl mx-auto animate-in slide-in-from-right-4">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-skin-text">Pedagogical Structure</h3>
                        <p className="text-skin-muted text-xs">Review the AI's lesson plan before generating audio.</p>
                    </div>

                    <div className="bg-skin-base/40 p-6 rounded-xl border border-skin-border">
                        <h4 className="text-sm font-bold text-skin-accent uppercase mb-4 tracking-widest">{teachingMap.topic}</h4>
                        
                        <div className="space-y-6 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-skin-border"></div>

                            {teachingMap.units.map((unit, i) => (
                                <div key={i} className="relative pl-10">
                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-skin-surface border border-skin-accent flex items-center justify-center text-xs font-bold text-skin-accent z-10">
                                        {i + 1}
                                    </div>
                                    <div className="bg-skin-surface border border-skin-border p-4 rounded-lg">
                                        <h5 className="font-bold text-skin-text text-sm mb-2">{unit.title}</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-skin-muted uppercase font-bold text-[10px] block">Concept</span>
                                                <p className="text-skin-text/80">{unit.coreConcept}</p>
                                            </div>
                                            <div>
                                                <span className="text-skin-muted uppercase font-bold text-[10px] block">Example</span>
                                                <p className="text-skin-text/80">{unit.realWorldExample}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <button onClick={() => setStep(1)} className="text-skin-muted hover:text-skin-text text-sm">Back</button>
                        <button 
                            onClick={() => setStep(3)}
                            className="btn-glow px-8 py-3 rounded-xl text-white font-bold text-sm tracking-wide"
                        >
                            CONFIRM STRUCTURE
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: HOST STUDIO */}
            {step === 3 && (
                <div className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-skin-text mb-2">Host Studio</h3>
                        <p className="text-skin-muted text-sm">Configure your AI host's personality and voice dynamics.</p>
                    </div>

                    <div className="bg-skin-base/30 p-6 rounded-2xl border border-skin-border">
                        <HostTuner config={hostConfig} onChange={setHostConfig} />
                        
                        {/* AUDIENCE Q&A TOGGLE (NEW) */}
                        <div className="mt-6 pt-6 border-t border-skin-border">
                            <label className="text-[10px] font-bold text-skin-muted uppercase tracking-widest mb-2 block">Audience Q&A Simulation</label>
                            <div className="flex gap-2">
                                {['off', 'light', 'normal', 'heavy'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setHostConfig(prev => ({...prev, audienceMode: opt as any}))}
                                        className={`flex-1 py-2 rounded text-xs font-bold uppercase transition-all ${hostConfig.audienceMode === opt ? 'bg-indigo-600 text-white shadow-lg' : 'bg-skin-surface border border-skin-border text-skin-muted hover:text-skin-text'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-skin-muted mt-2">
                                Simulate listener questions to make the session feel live and interactive.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <button onClick={() => setStep(mode === 'Teaching' ? 2 : 1)} className="text-skin-muted hover:text-skin-text text-sm">Back</button>
                        <button 
                            onClick={handleFinalize}
                            disabled={isGenerating}
                            className="btn-glow px-8 py-3 rounded-xl text-white font-bold text-sm tracking-wide flex items-center gap-3 disabled:opacity-50"
                        >
                            {isGenerating ? "STARTING..." : "GENERATE EPISODE"}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: PRODUCTION */}
            {step === 4 && (
                <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                    <div className="relative w-32 h-32 mb-8">
                        <div className="absolute inset-0 rounded-full border-4 border-skin-surface border-t-skin-accent animate-spin"></div>
                        <div className="absolute inset-4 rounded-full bg-skin-accent/10 flex items-center justify-center animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-skin-accent">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-skin-text mb-2">Producing Episode</h3>
                    <p className="text-skin-accent font-mono text-sm uppercase tracking-widest mb-4">{status}</p>
                    
                    <div className="max-w-md mx-auto text-xs text-skin-muted space-y-1">
                        <p>1. Analyzing Source Material</p>
                        <p>2. Scripting with "{hostConfig.personality}" Persona</p>
                        <p>3. Rendering High-Fidelity Audio</p>
                    </div>

                    {error && (
                        <div className="mt-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                            {error}
                            <button onClick={() => setStep(3)} className="block mt-2 text-xs font-bold uppercase underline">Return to Studio</button>
                        </div>
                    )}
                </div>
            )}

        </div>
    </div>
  );
};
