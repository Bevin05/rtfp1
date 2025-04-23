import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, List, ListItem, ListItemText, Grid, Box, CircularProgress, Snackbar, IconButton, Tabs, Tab } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
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
  favorite: boolean;
}

interface Analytics {
  totalConversions: number;
  totalCharacters: number;
  languageStats: { [key: string]: number };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);

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

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setHistory(history.filter(item => item.id !== id));
        setSnackbarMessage('History item deleted successfully');
        setSnackbarOpen(true);
        fetchAnalytics();
      } else {
        console.error('Failed to delete history item:', response.statusText);
        setSnackbarMessage('Failed to delete history item');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error deleting history item:', error);
      setSnackbarMessage('Error deleting history item');
      setSnackbarOpen(true);
    }
  };

  const handleFavoriteToggle = async (id: number, currentFavorite: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/history/${id}/favorite`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ favorite: !currentFavorite })
      });
      
      if (response.ok) {
        // Update the history state
        setHistory(history.map(item => 
          item.id === id ? { ...item, favorite: !currentFavorite } : item
        ));
        setSnackbarMessage('Favorite status updated successfully');
        setSnackbarOpen(true);
      } else {
        console.error('Failed to update favorite status:', response.statusText);
        setSnackbarMessage('Failed to update favorite status');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
      setSnackbarMessage('Error updating favorite status');
      setSnackbarOpen(true);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderHistoryList = (items: HistoryItem[]) => (
    <List>
      {items.map((item) => (
        <ListItem
          key={item.id}
          divider
          secondaryAction={
            <Box>
              <IconButton
                edge="end"
                aria-label="favorite"
                onClick={() => handleFavoriteToggle(item.id, item.favorite)}
                sx={{ mr: 1 }}
              >
                {item.favorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDelete(item.id)}
                sx={{ mr: 1 }}
              >
                <DeleteIcon />
              </IconButton>
              <ShareButton historyId={item.id.toString()} />
            </Box>
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
  );

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  const favoriteItems = history.filter(item => item.favorite);
  const regularItems = history.filter(item => !item.favorite);

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
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="history tabs">
          <Tab label="All" />
          <Tab label="Favorites" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderHistoryList(history)}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {favoriteItems.length > 0 ? (
            renderHistoryList(favoriteItems)
          ) : (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              No favorite items yet. Click the heart icon to add items to favorites.
            </Typography>
          )}
        </TabPanel>
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