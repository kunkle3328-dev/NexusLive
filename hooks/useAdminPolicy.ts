
import { useState, useEffect, useCallback } from 'react';
import { AdminPolicy } from '../types';

// Default Safe Policy (Fallback)
const DEFAULT_POLICY: AdminPolicy = {
    allowVoiceMemory: true,
    maxImperfectionLevel: 'natural',
    lockedPersonas: [],
    allowExport: true,
    allowSharing: true
};

export const useAdminPolicy = () => {
    const [policy, setPolicy] = useState<AdminPolicy>(DEFAULT_POLICY);
    const [isLoading, setIsLoading] = useState(true);

    // Startup-Safe Load
    useEffect(() => {
        const loadPolicy = async () => {
            // Simulate async fetch
            await new Promise(r => setTimeout(r, 100)); // Minimal delay to not block
            
            // In a real app, fetch from endpoint. Here we use localStorage or default
            try {
                const stored = localStorage.getItem('nexus_admin_policy');
                if (stored) {
                    setPolicy({ ...DEFAULT_POLICY, ...JSON.parse(stored) });
                }
            } catch (e) {
                console.warn("Failed to load admin policy, using defaults.");
            } finally {
                setIsLoading(false);
            }
        };
        loadPolicy();
    }, []);

    const updatePolicy = useCallback((updates: Partial<AdminPolicy>) => {
        setPolicy(prev => {
            const next = { ...prev, ...updates };
            localStorage.setItem('nexus_admin_policy', JSON.stringify(next));
            return next;
        });
    }, []);

    return {
        policy,
        isLoading,
        updatePolicy
    };
};
