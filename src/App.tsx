import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Settings, Languages, Mic, Save, History as HistoryIcon, Repeat, Share2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TextToSpeech from './components/TextToSpeech';
import History from './components/History';
import SharedHistory from './components/SharedHistory';

// Create Supabase client with error handling
const createSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Please connect to Supabase first.');
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

const supabase = createSupabaseClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  if (!token) {
    return null;
  }

  return <>{children}</>;
};

interface VoiceOption {
  name: string;
  lang: string;
}

interface SpeechHistoryItem {
  id: string;
  text: string;
  voice_name: string;
  settings: {
    volume: number;
    rate: number;
    pitch: number;
    emotion?: string;
  };
  ssml?: string;
  created_at: string;
}

const emotions = ['neutral', 'happy', 'sad', 'angry', 'excited'];

function App() {
  const [text, setText] = useState('');
  const [isPaused, setIsPaused] = useState(true);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [emotion, setEmotion] = useState('neutral');
  const [useSSML, setUseSSML] = useState(false);
  const [history, setHistory] = useState<SpeechHistoryItem[]>([]);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const speechSynthesis = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      setSelectedVoice(availableVoices[0]);
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Load history only if Supabase is configured
    if (supabase) {
      loadHistory();
    }

    return () => {
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const loadHistory = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('speech_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setHistory(data);
    }
  };

  const saveToHistory = async () => {
    if (!supabase) {
      console.warn('Supabase not configured. History will not be saved.');
      return;
    }

    const { error } = await supabase
      .from('speech_history')
      .insert({
        text,
        voice_name: selectedVoice?.name,
        settings: {
          volume,
          rate,
          pitch,
          emotion,
        },
        ssml: useSSML ? text : null,
      });

    if (!error) {
      loadHistory();
    }
  };

  const speak = () => {
    if (utteranceRef.current) {
      speechSynthesis.cancel();
    }

    if (text !== '') {
      const utterance = new SpeechSynthesisUtterance(useSSML ? stripSSML(text) : text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.volume = volume;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Apply emotional modifications based on selected emotion
      if (emotion !== 'neutral') {
        switch (emotion) {
          case 'happy':
            utterance.pitch *= 1.2;
            utterance.rate *= 1.1;
            break;
          case 'sad':
            utterance.pitch *= 0.8;
            utterance.rate *= 0.9;
            break;
          case 'angry':
            utterance.pitch *= 1.3;
            utterance.rate *= 1.2;
            break;
          case 'excited':
            utterance.pitch *= 1.4;
            utterance.rate *= 1.3;
            break;
        }
      }

      utterance.onend = () => {
        if (loopEnabled) {
          speak();
        } else {
          setIsPaused(true);
        }
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
      setIsPaused(false);
      saveToHistory();
    }
  };

  const stripSSML = (ssmlText: string) => {
    return ssmlText.replace(/<[^>]*>/g, '');
  };

  const pauseOrResume = () => {
    if (isPaused) {
      speechSynthesis.resume();
    } else {
      speechSynthesis.pause();
    }
    setIsPaused(!isPaused);
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPaused(true);
  };

  const exportAudio = () => {
    // This is a placeholder for audio export functionality
    // Actual implementation would require Web Audio API and audio file creation
    alert('Audio export feature coming soon!');
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/text-to-speech" element={
          <ProtectedRoute>
            <TextToSpeech />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        } />
        <Route path="/shared/:shareId" element={<SharedHistory />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;