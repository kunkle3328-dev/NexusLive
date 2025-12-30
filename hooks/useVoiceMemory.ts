
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { UserVoiceMemory, VoiceState, VoiceProfile, WorkspaceVoiceMemory, VoiceTrait } from '../types';

const STORAGE_KEY = 'nexus_voice_memory_v2';

// Default "Day 0" Memory
const DEFAULT_MEMORY: UserVoiceMemory = {
    paceBias: 0,
    warmthBias: 0,
    firmnessBias: 0,
    pauseTolerance: 'neutral',
    imperfectionPreference: 'neutral',
    sessionCount: 0,
    avgSessionLength: 0,
    interruptionRate: 0,
    lastStableTimestamp: Date.now(),
    lockedTraits: []
};

// Mock Workspaces for Demo
const MOCK_WORKSPACES: WorkspaceVoiceMemory[] = [
    {
        id: 'ws_legal',
        name: 'Legal Team',
        description: 'Formal, precise, and slower paced.',
        defaults: { paceBias: -0.1, warmthBias: -2, firmnessBias: 3 },
        lockedTraits: ['firmness'] // Admin forced lock
    },
    {
        id: 'ws_creative',
        name: 'Creative Studio',
        description: 'High energy, warm, and rapid fire.',
        defaults: { paceBias: 0.1, warmthBias: 4, firmnessBias: -1 },
        lockedTraits: []
    }
];

export const useVoiceMemory = (currentVoiceState: VoiceState) => {
    const [userMemory, setUserMemory] = useState<UserVoiceMemory>(DEFAULT_MEMORY);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Learning Session Signals
    const interruptions = useRef(0);
    const hasInitialized = useRef(false);

    // 1. Startup-Safe Async Load
    useEffect(() => {
        const loadMemory = async () => {
            try {
                // Yield to main thread to ensure UI paints first
                await new Promise(r => setTimeout(r, 50));
                
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setUserMemory(prev => ({ ...prev, ...parsed }));
                }
            } catch (e) {
                console.warn("Voice memory load failed, falling back to defaults.", e);
            } finally {
                setIsLoaded(true);
                setUserMemory(prev => ({ ...prev, sessionCount: prev.sessionCount + 1 }));
            }
        };
        
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            loadMemory();
        }
    }, []);

    // 2. Resolve Effective Memory (Hierarchy: Workspace > User)
    // IMPORTANT: Locks are respected. If User locks a trait, it overrides workspace default for that trait?
    // Rule from prompt: "Locks... Persist across sessions... Override passive learning signals".
    // Rule from prompt: "Workspace memory never overwrites personal memory." -> This implies User Preferences sit on top or alongside.
    // Let's implement: Effective Bias = Workspace Bias (if exists) + User Bias (if exists) 
    // BUT if a trait is locked in User Memory, we use User Memory value exclusively (frozen).
    
    const activeWorkspace = useMemo(() => 
        MOCK_WORKSPACES.find(w => w.id === activeWorkspaceId), 
    [activeWorkspaceId]);

    const effectiveMemory = useMemo((): UserVoiceMemory => {
        if (!activeWorkspace) return userMemory;

        // Merge Strategy: Workspace sets the baseline, User Memory acts as learned delta/preference on top?
        // OR Workspace completely overrides? Prompt says "Workspace Voice Memory (shared defaults)".
        // Let's use Workspace as the Base, and apply unlocked User Biases on top, 
        // unless User has explicitly locked a trait to a specific value.
        
        return {
            ...userMemory,
            paceBias: userMemory.lockedTraits.includes('pace') 
                ? userMemory.paceBias 
                : (activeWorkspace.defaults.paceBias || 0) + (userMemory.paceBias * 0.5), // Dampen user bias in workspace
            
            warmthBias: userMemory.lockedTraits.includes('warmth')
                ? userMemory.warmthBias
                : (activeWorkspace.defaults.warmthBias || 0) + (userMemory.warmthBias * 0.5),

            firmnessBias: userMemory.lockedTraits.includes('firmness')
                ? userMemory.firmnessBias
                : (activeWorkspace.defaults.firmnessBias || 0) + (userMemory.firmnessBias * 0.5),
        };
    }, [userMemory, activeWorkspace]);

    // 3. Passive Learning: Interruption Tracking
    useEffect(() => {
        if (currentVoiceState === VoiceState.INTERRUPTED) {
            interruptions.current++;
            
            // Immediate Feedback (Session-Scoped)
            // Only update if NOT locked
            setUserMemory(prev => {
                if (prev.lockedTraits.includes('pace')) return prev;
                
                // Very subtle nudge per interruption
                // Cap at +0.3 (significantly faster)
                const newPaceBias = Math.min(0.3, prev.paceBias + 0.01);
                
                return { ...prev, paceBias: newPaceBias };
            });
        }
    }, [currentVoiceState]);

    // 4. Commit to Long-Term Memory (Debounced Save)
    const saveMemory = useCallback((newMemory: UserVoiceMemory) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newMemory));
        } catch (e) {
            console.warn("Failed to persist voice memory", e);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const timer = setTimeout(() => saveMemory(userMemory), 2000);
        return () => clearTimeout(timer);
    }, [userMemory, isLoaded, saveMemory]);

    // 5. External Update Interface (e.g., from Sliders)
    const updateMemoryFromInteraction = useCallback((profileDelta: Partial<VoiceProfile>) => {
        setUserMemory(prev => {
            const next = { ...prev };
            const learningRate = 0.1; // 10% weight to manual changes

            // Only update if NOT locked
            if (profileDelta.pace !== undefined && !prev.lockedTraits.includes('pace')) {
                const diff = profileDelta.pace - 1.0; 
                next.paceBias = (prev.paceBias * (1 - learningRate)) + (diff * learningRate);
            }

            if (profileDelta.warmth !== undefined && !prev.lockedTraits.includes('warmth')) {
                const diff = profileDelta.warmth - 5;
                next.warmthBias = (prev.warmthBias * (1 - learningRate)) + (diff * learningRate);
            }

            if (profileDelta.firmness !== undefined && !prev.lockedTraits.includes('firmness')) {
                const diff = profileDelta.firmness - 5;
                next.firmnessBias = (prev.firmnessBias * (1 - learningRate)) + (diff * learningRate);
            }

            return next;
        });
    }, []);

    // 6. Memory Reset
    const wipeMemory = useCallback(() => {
        setUserMemory(DEFAULT_MEMORY);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // 7. Lock Trait Toggle
    const toggleLock = useCallback((trait: VoiceTrait) => {
        setUserMemory(prev => {
            const isLocked = prev.lockedTraits.includes(trait);
            const newLocks = isLocked 
                ? prev.lockedTraits.filter(t => t !== trait)
                : [...prev.lockedTraits, trait];
            return { ...prev, lockedTraits: newLocks };
        });
    }, []);

    // 8. Generate Transparency Statement (Plain Language)
    const getTransparencyStatement = useCallback((): string => {
        const parts = [];
        const m = effectiveMemory; // Use effective memory for display so user sees the *result*

        // Pace
        if (m.paceBias > 0.1) parts.push("You tend to prefer a brisk, concise pace.");
        else if (m.paceBias < -0.1) parts.push("You seem to prefer a relaxed, thoughtful pace.");
        
        // Warmth
        if (m.warmthBias > 2) parts.push("You respond well to high warmth.");
        else if (m.warmthBias < -2) parts.push("You prefer a cooler, professional tone.");
        
        // Firmness
        if (m.firmnessBias > 2) parts.push("You prefer directness.");
        
        // Interruption Context
        if (interruptions.current > 5) parts.push("We're speeding up due to frequent interruptions.");

        if (parts.length === 0) return "We are currently learning your conversational preferences.";
        return parts.join(" ");
    }, [effectiveMemory]);

    return {
        memory: effectiveMemory, // The actual bias values applied
        userMemory, // The raw user data (for UI display of "my settings")
        isLoaded,
        activeWorkspace,
        availableWorkspaces: MOCK_WORKSPACES,
        setActiveWorkspaceId,
        updateMemoryFromInteraction,
        wipeMemory,
        toggleLock,
        getTransparencyStatement
    };
};
