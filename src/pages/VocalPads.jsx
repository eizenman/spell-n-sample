import { useState, useEffect, useCallback, useRef } from 'react';
import GlobalControls from '@/components/vocalpads/GlobalControls';
import PadGrid from '@/components/vocalpads/PadGrid';
import { fetchVoices, generateSpeech, DEFAULT_API_KEY } from '@/lib/elevenlabs';
import {
  initAudiotool,
  listProjects,
  openProject,
  findMachinistes,
  uploadSample,
  setChannelSample,
  setChannelSampleRange,
} from '@/lib/audiotool-nexus';
import { translateEmojisToTags } from '@/lib/emoji-tags';

const STORAGE_KEYS = {
  apiKey: 'vp_elevenlabs_key',
  language: 'vp_language',
  project: 'vp_project_name',
  format: 'vp_output_format',
};

const EMPTY_PAD = () => ({ text: '', status: 'idle', audioUrl: null, error: null });

export default function VocalPads() {
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(
    () => localStorage.getItem(STORAGE_KEYS.apiKey) || DEFAULT_API_KEY
  );
  const [outputFormat, setOutputFormat] = useState(
    () => localStorage.getItem(STORAGE_KEYS.format) || 'mp3'
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => localStorage.getItem(STORAGE_KEYS.language) || 'en'
  );
  const [selectedProjectName, setSelectedProjectName] = useState(
    () => localStorage.getItem(STORAGE_KEYS.project) || ''
  );

  // Audiotool auth state
  const [authStatus, setAuthStatus] = useState('checking');
  const [authError, setAuthError] = useState(null);
  const [userName, setUserName] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Project connection state
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);
  const [machinistes, setMachinistes] = useState([]);
  const [selectedMachinisteId, setSelectedMachinisteId] = useState(null);

  const [voices, setVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [pads, setPads] = useState(Array(9).fill(null).map(EMPTY_PAD));

  const authRef = useRef(null);
  const clientRef = useRef(null);
  const docRef = useRef(null);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.apiKey, elevenLabsApiKey);
  }, [elevenLabsApiKey]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.language, selectedLanguage);
  }, [selectedLanguage]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.format, outputFormat);
  }, [outputFormat]);

  // Initialize Audiotool OAuth on mount
  useEffect(() => {
    let cancelled = false;
    initAudiotool()
      .then((result) => {
        if (cancelled) return;
        console.debug('[VoxMachina] auth result:', result.status);
        authRef.current = result;
        if (result.status === 'authenticated') {
          clientRef.current = result;
          setUserName(result.userName);
          setAuthStatus('authenticated');
          setLoadingProjects(true);
          listProjects(result)
            .then((projs) => {
              if (cancelled) return;
              console.debug('[VoxMachina] projects loaded:', projs.length);
              setProjects(projs);
            })
            .catch((err) => {
              if (cancelled) return;
              console.debug('[VoxMachina] listProjects error:', err);
              setAuthError(err.message || 'Failed to load projects');
            })
            .finally(() => {
              if (!cancelled) setLoadingProjects(false);
            });
        } else {
          setAuthStatus('unauthenticated');
          if (result.error) setAuthError(result.error.message);
          console.debug('[VoxMachina] not authenticated:', result.error?.message);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.debug('[VoxMachina] initAudiotool error:', err);
        setAuthStatus('unauthenticated');
        setAuthError(err.message || 'Audiotool init failed');
      });
    return () => {
      cancelled = true;
      if (docRef.current) docRef.current.stop();
    };
  }, []);

  // Auto-open previously selected project once projects are loaded
  useEffect(() => {
    if (
      authStatus === 'authenticated' &&
      projects.length > 0 &&
      selectedProjectName &&
      connectionStatus === 'disconnected'
    ) {
      handleProjectSelect(selectedProjectName);
    }
  }, [authStatus, projects, selectedProjectName, connectionStatus]);

  // Fetch voices when API key changes
  useEffect(() => {
    if (!elevenLabsApiKey) {
      setVoices([]);
      return;
    }
    let cancelled = false;
    fetchVoices(elevenLabsApiKey)
      .then((v) => {
        if (cancelled) return;
        setVoices(v);
        if (v.length > 0 && !selectedVoiceId) setSelectedVoiceId(v[0].voice_id);
      })
      .catch(() => {
        if (!cancelled) setVoices([]);
      });
    return () => {
      cancelled = true;
    };
  }, [elevenLabsApiKey]);

  const handleLogin = useCallback(() => {
    if (authRef.current && authRef.current.status === 'unauthenticated') {
      authRef.current.login();
    }
  }, []);

  const handleProjectSelect = useCallback(async (projectName) => {
    setSelectedProjectName(projectName);
    localStorage.setItem(STORAGE_KEYS.project, projectName);
    if (!clientRef.current || !projectName) return;

    // Close previous doc
    if (docRef.current) {
      docRef.current.stop();
      docRef.current = null;
    }

    setConnectionStatus('connecting');
    setConnectionError(null);
    setMachinistes([]);
    setSelectedMachinisteId(null);

    try {
      const doc = await openProject(clientRef.current, projectName);
      docRef.current = doc;
      const machines = findMachinistes(doc);
      setMachinistes(machines);
      if (machines.length > 0) setSelectedMachinisteId(machines[0].id);
      setConnectionStatus('connected');
      console.debug('[VoxMachina] project connected:', projectName, 'machinistes:', machines.length, 'selected:', machines[0]?.id);
    } catch (err) {
      console.debug('[VoxMachina] project open error:', err);
      setConnectionStatus('error');
      setConnectionError(err.message || 'Failed to open project');
    }
  }, []);

  const updatePad = useCallback((index, updates) => {
    setPads((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  }, []);

  const handlePadTextChange = useCallback((index, text) => {
    setPads((prev) => prev.map((p, i) => (i === index ? { ...p, text } : p)));
  }, []);

  const handleGenerate = useCallback(
    async (padIndex) => {
      const pad = pads[padIndex];
      if (!pad.text.trim() || !elevenLabsApiKey || !selectedVoiceId) return;

      if (pad.audioUrl) URL.revokeObjectURL(pad.audioUrl);
      updatePad(padIndex, { status: 'generating', error: null, audioUrl: null });

      try {
        const translatedText = translateEmojisToTags(pad.text);
        console.debug('[VoxMachina] generate pad:', padIndex, 'text:', translatedText);
        const audioBlob = await generateSpeech(elevenLabsApiKey, {
          text: translatedText,
          voiceId: selectedVoiceId,
          language: selectedLanguage,
          outputFormat,
        });
        console.debug('[VoxMachina] TTS done — blob:', audioBlob.size, 'bytes, type:', audioBlob.type);

        const audioUrl = URL.createObjectURL(audioBlob);

        // Push to Machiniste if connected
        if (clientRef.current && docRef.current && selectedMachinisteId) {
          console.debug('[VoxMachina] pushing to Machiniste:', selectedMachinisteId, 'channel:', padIndex);
          const sampleMeta = await uploadSample(clientRef.current, audioBlob, pad.text);
          if (sampleMeta) {
            await setChannelSample(docRef.current, selectedMachinisteId, padIndex, sampleMeta);
            console.debug('[VoxMachina] channel sample set — pad:', padIndex);
          }
        }

        updatePad(padIndex, { status: 'loaded', audioUrl });
      } catch (err) {
        console.debug('[VoxMachina] generate error:', err);
        updatePad(padIndex, { status: 'error', error: err.message });
      }
    },
    [pads, elevenLabsApiKey, selectedVoiceId, selectedLanguage, selectedMachinisteId, updatePad]
  );

  const handleRangeChange = useCallback(
    async (padIndex, startRatio, endRatio) => {
      if (!docRef.current || !selectedMachinisteId) return;
      console.debug('[VoxMachina] range change — pad:', padIndex, 'start:', startRatio, 'end:', endRatio);
      try {
        await setChannelSampleRange(docRef.current, selectedMachinisteId, padIndex, startRatio, endRatio);
      } catch (err) {
        console.debug('[VoxMachina] range change error:', err);
      }
    },
    [selectedMachinisteId]
  );

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 md:p-8">
      {/* Red chassis */}
      <div className="w-full max-w-5xl bg-destructive rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-2xl">
        {/* Top: speaker grille + title */}
        <div className="flex items-center gap-4 mb-5">
          <div className="hidden sm:flex w-28 h-12 rounded-lg bg-card/80 p-2 shrink-0">
            <div
              className="w-full h-full rounded"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1.5px)',
                backgroundSize: '5px 5px',
              }}
            />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-destructive-foreground leading-none tracking-tight">
            spell<span className="text-accent">-n-</span>sample
          </h1>
        </div>

        {/* Black screen — controls */}
        <div className="bg-card rounded-xl p-4 mb-5">
          <GlobalControls
            elevenLabsApiKey={elevenLabsApiKey}
            onElevenLabsApiKeyChange={setElevenLabsApiKey}
            outputFormat={outputFormat}
            onOutputFormatChange={setOutputFormat}
            authStatus={authStatus}
            authError={authError}
            onLogin={handleLogin}
            userName={userName}
            projects={projects}
            loadingProjects={loadingProjects}
            selectedProjectName={selectedProjectName}
            onProjectSelect={handleProjectSelect}
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            machinistes={machinistes}
            selectedMachinisteId={selectedMachinisteId}
            onMachinisteSelect={setSelectedMachinisteId}
            voices={voices}
            selectedVoiceId={selectedVoiceId}
            onVoiceSelect={setSelectedVoiceId}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
        </div>

        {/* Blue keyboard panel — pads */}
        <div className="bg-secondary rounded-2xl p-4 md:p-6">
          <PadGrid
            pads={pads}
            onTextChange={handlePadTextChange}
            onGenerate={handleGenerate}
            showLocators={connectionStatus === 'connected' && !!selectedMachinisteId}
            onRangeChange={handleRangeChange}
          />
        </div>

        {/* No Machiniste warning */}
        {connectionStatus === 'connected' && machinistes.length === 0 && (
          <p className="text-center text-sm text-destructive-foreground/70 mt-4 font-heading">
            No Machiniste found — add one in Audiotool to push samples.
          </p>
        )}

        {/* Bottom yellow badge */}
        <div className="bg-accent rounded-xl mt-5 px-6 py-2.5 flex items-center justify-center">
          <span className="font-display font-bold text-accent-foreground text-sm md:text-base tracking-[0.2em] uppercase">
            Try adding emojis before or after your word 😱
          </span>
        </div>
      </div>
    </div>
  );
}