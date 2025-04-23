import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Play, Pause, Settings, Mic, Save, Repeat, Timer } from 'lucide-react';
import SpeechProgress from './SpeechProgress';

const TextToSpeech = () => {
  const [text, setText] = useState('');
  const [isPaused, setIsPaused] = useState(true);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [emotion, setEmotion] = useState('neutral');
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [remainingTime, setRemainingTime] = useState(0);
  const navigate = useNavigate();
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const emotions = ['neutral', 'happy', 'sad', 'angry', 'excited'];

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      setSelectedVoice(availableVoices[0]);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const saveToHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to save history');
        return;
      }

      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice?.name || 'Default',
          settings: {
            volume,
            rate,
            pitch,
            emotion
          }
        })
      });

      if (response.ok) {
        setSuccess('Successfully saved to history!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save to history');
      }
    } catch (error) {
      console.error('Error saving to history:', error);
      setError('Failed to save to history');
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setRemainingTime(timerMinutes * 60);
    
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          stop();
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRemainingTime(0);
  };

  const speak = async () => {
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
    }

    if (text !== '') {
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.volume = volume;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Apply emotional modifications
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

      // Set up word tracking
      const words = text.split(/\s+/);
      setTotalWords(words.length);
      setCurrentWordIndex(0);

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          setCurrentWordIndex(prev => Math.min(prev + 1, words.length));
        }
      };

      utterance.onend = () => {
        if (loopEnabled) {
          speak();
        } else {
          setIsPaused(true);
          setCurrentWordIndex(0);
          stopTimer();
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPaused(false);
      
      if (timerEnabled) {
        startTimer();
      }
    }
  };

  const pauseOrResume = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
    } else {
      window.speechSynthesis.pause();
    }
    setIsPaused(!isPaused);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPaused(true);
    setCurrentWordIndex(0);
    stopTimer();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center mb-8">
          <Mic className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Text to Speech</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <textarea
            className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
            placeholder="Enter text to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <SpeechProgress 
            text={text}
            isPlaying={!isPaused}
            currentWordIndex={currentWordIndex}
            totalWords={totalWords}
          />

          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={speak}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!text}
            >
              <Play className="w-5 h-5 mr-2" />
              Play
            </button>

            <button
              onClick={pauseOrResume}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              disabled={!utteranceRef.current}
            >
              {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <button
              onClick={stop}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={!utteranceRef.current}
            >
              <VolumeX className="w-5 h-5 mr-2" />
              Stop
            </button>

            <button
              onClick={() => setLoopEnabled(!loopEnabled)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                loopEnabled ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Repeat className="w-5 h-5 mr-2" />
              Loop
            </button>

            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-gray-600" />
              <input
                type="number"
                min="1"
                max="120"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Math.min(120, Math.max(1, parseInt(e.target.value) || 30)))}
                className="w-16 p-1 border rounded"
                disabled={!isPaused}
              />
              <span className="text-gray-600">minutes</span>
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  timerEnabled ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
                disabled={!isPaused}
              >
                {timerEnabled ? 'Timer On' : 'Timer Off'}
              </button>
            </div>

            {timerEnabled && remainingTime > 0 && (
              <div className="flex items-center text-gray-600">
                <Timer className="w-5 h-5 mr-2" />
                <span>
                  {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')} remaining
                </span>
              </div>
            )}

            <button
              onClick={saveToHistory}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={!text}
            >
              <Save className="w-5 h-5 mr-2" />
              Save to History
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice
              </label>
              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedVoice?.name}
                onChange={(e) => setSelectedVoice(voices.find(v => v.name === e.target.value) || null)}
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emotion
              </label>
              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
              >
                {emotions.map((e) => (
                  <option key={e} value={e}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume: {volume.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speed: {rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch: {pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech; 