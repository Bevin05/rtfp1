import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, List, ListItem, ListItemText, Grid, Box, CircularProgress, Snackbar } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ShareButton from './ShareButton';

interface HistoryItem {
  id: number;
  text: string;
  voice: string;
  settings: {
    volume: number;
    rate: number;
    pitch: number;
    emotion?: string;
  };
  created_at: string;
  share_id?: string;
}

interface Analytics {
  totalConversions: number;
  totalCharacters: number;
  languageStats: { [key: string]: number };
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchHistory();
    fetchAnalytics();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        console.error('Failed to fetch history:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Speech History
      </Typography>

      {analytics && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h6">Total Conversions</Typography>
                <Typography variant="h4">{analytics.totalConversions}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h6">Total Characters</Typography>
                <Typography variant="h4">{analytics.totalCharacters}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h6">Languages Used</Typography>
                {Object.entries(analytics.languageStats).map(([lang, count]) => (
                  <Typography key={lang}>
                    {lang}: {count}
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper>
        <List>
          {history.map((item) => (
            <ListItem
              key={item.id}
              divider
              secondaryAction={
                <ShareButton historyId={item.id.toString()} />
              }
            >
              <ListItemText
                primary={item.text}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      Voice: {item.voice}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="text.primary">
                      Settings: Volume {item.settings.volume}, Rate {item.settings.rate}, Pitch {item.settings.pitch}
                      {item.settings.emotion && `, Emotion: ${item.settings.emotion}`}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2">
                      Created: {new Date(item.created_at).toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
} 