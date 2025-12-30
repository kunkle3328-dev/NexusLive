
import { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { LearningSource, PodcastScriptLine, PodcastBlueprint, PodcastType, PodcastChapter, TeachingMap, HostConfig, ExportArtifacts, PublishingMetadata, PodcastEpisode } from '../types';
import { mergeBase64PCM } from '../utils/audioUtils';

const MODEL_TEXT = 'gemini-3-flash-preview'; 
const MODEL_AUDIO = 'gemini-2.5-flash-preview-tts'; 
const MODEL_IMAGE = 'gemini-2.5-flash-image'; 
const API_KEY = process.env.API_KEY as string;

export const useLearningAI = () => {
  const [generatingCount, setGeneratingCount] = useState(0);
  const isGenerating = generatingCount > 0;

  const getClient = () => new GoogleGenAI({ apiKey: API_KEY });

  const cleanJson = (text: string) => {
    if (!text) return '';
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) return markdownMatch[1].trim();
    
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) return text.substring(firstOpen, lastClose + 1);
    
    return text.trim();
  };

  // --- 1. INTELLIGENCE LAYER: TEACHING MAP ---
  const generateTeachingMap = useCallback(async (
      topic: string,
      audience: string,
      sources: LearningSource[]
  ): Promise<TeachingMap | null> => {
      setGeneratingCount(c => c + 1);
      try {
          const ai = getClient();
          const sourceContext = sources.map(s => `[${s.title}]: ${s.content.substring(0, 15000)}...`).join('\n\n');
          
          const prompt = `
            You are a Master Instructional Designer.
            Analyze the provided sources to create a "Teaching Map" for a podcast episode.
            
            TOPIC: ${topic}
            TARGET AUDIENCE: ${audience}
            
            SOURCES:
            ${sourceContext}
            
            TASK:
            Break this topic down into 3-5 distinct "Teaching Units" that build upon each other.
            For EACH unit, you must identify:
            1. Core Concept (The specific idea to teach)
            2. Analogy (A relatable comparison)
            3. Real World Example (Concrete application from sources or general knowledge)
            4. Checkpoint Question (A rhetorical question to check understanding)
            
            Also, suggest "Teaching Beats" (moments to pause and check in with the learner) for each unit.
            
            OUTPUT JSON:
            {
              "topic": "${topic}",
              "targetAudience": "${audience}",
              "summary": "1 sentence overview",
              "units": [
                {
                  "title": "Unit Title",
                  "coreConcept": "Definition...",
                  "analogy": "It's like...",
                  "realWorldExample": "For example...",
                  "checkpointQuestion": "So why does this matter?"
                }
              ],
              "beats": [
                 { "id": "beat_1", "conceptId": "concept_1", "prompt": "Want to review [Concept]?", "suggestedActions": ["Explain Simply", "Quiz Me"] }
              ]
            }
          `;

          const response = await ai.models.generateContent({
              model: MODEL_TEXT,
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });

          return JSON.parse(cleanJson(response.text || '{}'));
      } catch (e) {
          console.error("Teaching Map Error:", e);
          return null;
      } finally {
          setGeneratingCount(c => Math.max(0, c - 1));
      }
  }, []);

  // --- 2. SCRIPT GENERATION (Enhanced with Host Config & Audience) ---
  const generatePodcastScript = useCallback(async (
    topic: string,
    type: PodcastType,
    sources: LearningSource[],
    hostConfig: HostConfig,
    teachingMap?: TeachingMap
  ): Promise<{ title: string; script: PodcastScriptLine[] } | null> => {
    setGeneratingCount(c => c + 1);
    try {
      const ai = getClient();
      const sourceContext = sources.map(s => `SOURCE (${s.title}): ${s.content.substring(0, 20000)}...`).join('\n\n');
      
      const audienceDirective = hostConfig.audienceMode !== 'off' 
        ? `AUDIENCE MODE (${hostConfig.audienceMode}): Insert ${hostConfig.audienceMode === 'heavy' ? '5-6' : hostConfig.audienceMode === 'normal' ? '3-4' : '1-2'} "Audience Questions" into the script. 
           Frame them as "We just got a question from [Name] asking..." or "A listener might be wondering...". 
           Use diverse, realistic names. Questions should clarify complex points.`
        : 'No audience Q&A. Stick to the hosts.';

      const directorNotes = `
        HOST PERSONA SETTINGS:
        - Role: ${hostConfig.personality}
        - Pacing: ${hostConfig.pace > 1.05 ? 'Fast-paced, energetic' : hostConfig.pace < 0.95 ? 'Slow, thoughtful, deliberate' : 'Natural conversational'}
        - Warmth: ${hostConfig.warmth}/10 (${hostConfig.warmth > 7 ? 'Highly empathetic, soft' : 'Professional, objective'})
        - Imperfections: ${hostConfig.imperfections === 'high' ? 'Frequent (um, uh, you know, self-corrections)' : hostConfig.imperfections === 'low' ? 'Rare, mostly polished' : 'None, scripted perfection'}
        - Format: ${hostConfig.dualHost ? 'Two Hosts (Host & Expert)' : 'Single Host Monologue'}
        
        ${audienceDirective}
      `;

      let prompt = '';

      if (type === 'Teaching' && teachingMap) {
         prompt = `
            You are a "Teaching Podcast" producer.
            
            ${directorNotes}
            
            TEACHING MAP (Follow this structure strictly):
            ${JSON.stringify(teachingMap)}
            
            SOURCES:
            ${sourceContext}
            
            TASK:
            Write a word-for-word script.
            ${hostConfig.dualHost ? 'Speaker 1 (Host) guides the flow. Speaker 2 (Expert) explains the concepts.' : 'Single Host teaching directly to the listener.'}
            
            Apply the "Imperfections" setting by adding natural fillers or false starts into the text if requested (e.g. "I mean...", "Wait,").
            
            OUTPUT JSON:
            {
              "title": "Episode Title",
              "script": [
                { "speaker": "Host", "text": "..." },
                ${hostConfig.dualHost ? '{ "speaker": "Expert", "text": "..." }' : ''}
              ]
            }
         `;
      } else {
         prompt = `
            You are a Professional Podcast Producer.
            TOPIC: ${topic}
            
            ${directorNotes}
            
            SOURCES:
            ${sourceContext}
            
            Task: Create an engaging podcast script.
            Target Length: 1000-1500 words.
            Style: ${hostConfig.personality}.
            
            OUTPUT JSON:
            {
              "title": "Episode Title",
              "script": [
                { "speaker": "Host", "text": "..." },
                ${hostConfig.dualHost ? '{ "speaker": "Expert", "text": "..." }' : ''}
              ]
            }
         `;
      }

      const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(cleanJson(response.text || '{}'));
      return parsed.podcast || parsed;
    } catch (e) {
      console.error("Script Gen Error:", e);
      return null;
    } finally {
      setGeneratingCount(c => Math.max(0, c - 1));
    }
  }, []);

  // --- 3. AUDIO SYNTHESIS (Host Aware) ---
  const synthesizePodcastAudio = useCallback(async (
    script: PodcastScriptLine[],
    hostConfig: HostConfig,
    onProgress?: (percentage: number) => void
  ): Promise<string | null> => {
    setGeneratingCount(c => c + 1);
    try {
      if (!script || !script.length) throw new Error("Empty script");

      const ai = getClient();
      const MAX_CHAR_PER_CHUNK = 4000; 
      const chunks: PodcastScriptLine[][] = [];
      let currentChunk: PodcastScriptLine[] = [];
      let currentLen = 0;

      for (const line of script) {
          const lineLen = line.text.length + 10;
          if (currentLen + lineLen > MAX_CHAR_PER_CHUNK && currentChunk.length > 0) {
              chunks.push(currentChunk);
              currentChunk = [];
              currentLen = 0;
          }
          currentChunk.push(line);
          currentLen += lineLen;
      }
      if (currentChunk.length > 0) chunks.push(currentChunk);

      const results: string[] = new Array(chunks.length).fill('');
      
      const primaryVoice = hostConfig.voiceName; 
      const expertVoice = primaryVoice === 'Fenrir' ? 'Kore' : 'Fenrir'; 

      for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const conversationText = chunk.map(line => `${line.speaker}: ${line.text}`).join('\n');
          const prompt = `TTS the following conversation:\n\n${conversationText}`;

          if (i > 0) await new Promise(r => setTimeout(r, 8000)); 

          let retries = 0;
          let success = false;
          
          while (retries < 3 && !success) { 
              try {
                  const response = await ai.models.generateContent({
                      model: MODEL_AUDIO,
                      contents: [{ parts: [{ text: prompt }] }],
                      config: {
                          responseModalities: [Modality.AUDIO],
                          speechConfig: {
                              multiSpeakerVoiceConfig: {
                                  speakerVoiceConfigs: [
                                      { speaker: 'Host', voiceConfig: { prebuiltVoiceConfig: { voiceName: primaryVoice } } },
                                      { speaker: 'Expert', voiceConfig: { prebuiltVoiceConfig: { voiceName: expertVoice } } }
                                  ]
                              }
                          }
                      }
                  });
                  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                  if (audioData) {
                      results[i] = audioData;
                      success = true;
                  } else {
                      throw new Error("Empty audio response");
                  }
              } catch (e: any) {
                  retries++;
                  console.warn(`Chunk ${i} retry ${retries}`, e);
                  await new Promise(r => setTimeout(r, 3000 * retries));
              }
          }

          if (!success) {
               console.error("Audio chunk failed.");
               return null;
          }

          if (onProgress) onProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      return mergeBase64PCM(results.filter(r => !!r));

    } catch (e) {
      console.error("Audio Gen Error:", e);
      return null;
    } finally {
      setGeneratingCount(c => Math.max(0, c - 1));
    }
  }, []);

  const generateCoverImage = useCallback(async (topic: string, style: string): Promise<string | null> => {
    setGeneratingCount(c => c + 1);
    try {
      const ai = getClient();
      const prompt = `Abstract, cinematic 3D render for a podcast cover about "${topic}". 
      Style: ${style}, Futuristic, Enterprise Tech, Dark Mode, Neon accents. 
      High contrast, 8k resolution, minimalist but detailed. Center composition.`;

      const response = await ai.models.generateContent({
        model: MODEL_IMAGE, 
        contents: { parts: [{ text: prompt }] }
      });

      let imageBase64 = null;
      for (const candidate of response.candidates || []) {
        for (const part of candidate.content.parts) {
             if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
                 imageBase64 = part.inlineData.data;
                 break;
             }
        }
        if (imageBase64) break;
      }
      return imageBase64;
    } catch (e) {
      console.error("Image Gen Error:", e);
      return null;
    } finally {
      setGeneratingCount(c => Math.max(0, c - 1));
    }
  }, []);

  const chatWithSources = useCallback(async (
    question: string,
    sources: LearningSource[],
    history: { role: 'user' | 'model', text: string }[]
  ): Promise<string | null> => {
     const ai = getClient();
     const context = sources.map(s => `SOURCE: ${s.title}\nCONTENT: ${s.content.substring(0, 20000)}...`).join('\n\n');

     const prompt = `You are a helpful AI Tutor.
     SOURCES:
     ${context}
     
     Question: ${question}`;

     const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: prompt,
     });
     return response.text || '';
  }, []);

  const generateChapters = useCallback(async (
      context: string,
      duration: number
  ): Promise<PodcastChapter[]> => {
      setGeneratingCount(c => c + 1);
      try {
          const ai = getClient();
          const prompt = `
          Analyze the following podcast content and generate 5-8 chapter markers.
          Total duration: ${Math.floor(duration)} seconds.
          
          CONTENT:
          ${context.substring(0, 20000)}...

          OUTPUT JSON:
          {
            "chapters": [
              { "title": "string", "startTime": number, "summary": "string", "objective": "string", "keyTakeaways": ["string"] }
            ]
          }
          `;
          
          const response = await ai.models.generateContent({
              model: MODEL_TEXT,
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          const parsed = JSON.parse(cleanJson(response.text || '{}'));
          
          if (parsed.chapters) {
              return parsed.chapters.map((ch: any, i: number) => ({
                  ...ch,
                  id: `ch-${Date.now()}-${i}`,
                  startTime: Math.min(ch.startTime, duration)
              }));
          }
          return [];
      } catch (e) {
          console.error("Chapter gen error", e);
          return [];
      } finally {
          setGeneratingCount(c => Math.max(0, c - 1));
      }
  }, []);

  // --- 4. EXPORT & PUBLISHING (NEW) ---
  const generateStudyMaterials = useCallback(async (
      episode: PodcastEpisode
  ): Promise<ExportArtifacts | null> => {
      setGeneratingCount(c => c + 1);
      try {
          const ai = getClient();
          const scriptText = episode.script.map(l => `${l.speaker}: ${l.text}`).join('\n');
          
          const prompt = `
            You are an educational content creator.
            Create study materials based on this podcast transcript.
            
            TRANSCRIPT:
            ${scriptText.substring(0, 25000)}
            
            TASK 1: Generate Markdown Slides (5-7 slides).
            TASK 2: Generate a Study Guide summary.
            
            OUTPUT JSON:
            {
              "slidesMarkdown": "# Title\\n\\n* Bullet 1...",
              "studyGuideText": "Full text for a PDF study guide including summary, key terms, and 3 quiz questions."
            }
          `;

          const response = await ai.models.generateContent({
              model: MODEL_TEXT,
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          
          const parsed = JSON.parse(cleanJson(response.text || '{}'));
          
          // Create dummy Blob URL for PDF (Simulated)
          const pdfBlob = new Blob([parsed.studyGuideText], { type: 'text/plain' });
          const pdfUrl = URL.createObjectURL(pdfBlob);

          return {
              slidesMarkdown: parsed.slidesMarkdown,
              studyPdfUrl: pdfUrl,
              lastGeneratedAt: new Date()
          };

      } catch (e) {
          console.error("Export Gen Error", e);
          return null;
      } finally {
          setGeneratingCount(c => Math.max(0, c - 1));
      }
  }, []);

  const generateRSSFeed = useCallback((episode: PodcastEpisode): PublishingMetadata => {
      // Simulate RSS Generation
      const rssContent = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>${episode.title}</title>
            <description>${episode.teachingMap?.summary || 'Generated by Nexus Voice'}</description>
            <item>
              <title>${episode.title}</title>
              <description>${episode.topic}</description>
              <enclosure url="https://nexus-voice.demo/audio/${episode.id}.mp3" type="audio/mpeg"/>
              <guid>${episode.id}</guid>
              <pubDate>${new Date().toUTCString()}</pubDate>
            </item>
          </channel>
        </rss>
      `;
      const blob = new Blob([rssContent], { type: 'application/rss+xml' });
      return {
          rssUrl: URL.createObjectURL(blob),
          publicPageUrl: `https://nexus.app/listen/${episode.id}`,
          isPublished: true,
          feedTitle: episode.title,
          feedDescription: episode.teachingMap?.summary
      };
  }, []);

  // Passthrough
  const generateBlueprint = useCallback(async () => null, []);

  return {
    isGenerating,
    generateTeachingMap,
    generatePodcastScript,
    synthesizePodcastAudio,
    generateCoverImage,
    chatWithSources,
    generateChapters,
    generateBlueprint,
    generateStudyMaterials,
    generateRSSFeed
  };
};
