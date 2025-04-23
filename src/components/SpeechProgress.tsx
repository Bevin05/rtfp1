import React, { useEffect, useState } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface SpeechProgressProps {
  text: string;
  isPlaying: boolean;
  currentWordIndex: number;
  totalWords: number;
}

export default function SpeechProgress({ text, isPlaying, currentWordIndex, totalWords }: SpeechProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPlaying && totalWords > 0) {
      const newProgress = (currentWordIndex / totalWords) * 100;
      setProgress(newProgress);
    } else if (!isPlaying) {
      setProgress(0);
    }
  }, [currentWordIndex, totalWords, isPlaying]);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ 
          height: 10,
          borderRadius: 5,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            backgroundColor: '#1976d2',
          }
        }} 
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {isPlaying ? `${currentWordIndex} of ${totalWords} words` : 'Ready'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      </Box>
    </Box>
  );
} 