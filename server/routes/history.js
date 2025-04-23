import express from 'express';
import { db } from '../database.mjs';
import { nanoid } from 'nanoid';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's history
router.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const history = await db.all(
      'SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get analytics
router.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    // Get total conversions
    const totalConversions = await db.get(
      'SELECT COUNT(*) as count FROM history WHERE user_id = ?',
      [req.user.id]
    );

    // Get total characters
    const totalCharacters = await db.get(
      'SELECT SUM(LENGTH(text)) as total FROM history WHERE user_id = ?',
      [req.user.id]
    );

    // Get voice statistics
    const voiceStats = await db.all(
      'SELECT voice, COUNT(*) as count FROM history WHERE user_id = ? GROUP BY voice',
      [req.user.id]
    );

    const stats = {
      totalConversions: totalConversions.count,
      totalCharacters: totalCharacters.total || 0,
      languageStats: Object.fromEntries(
        voiceStats.map(stat => [stat.voice, stat.count])
      )
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Generate share link
router.post('/api/share', authenticateToken, async (req, res) => {
  try {
    const { historyId } = req.body;
    
    // Verify the history item belongs to the user
    const historyItem = await db.get(
      'SELECT * FROM history WHERE id = ? AND user_id = ?',
      [historyId, req.user.id]
    );

    if (!historyItem) {
      return res.status(404).json({ error: 'History item not found' });
    }

    // Generate share ID if not exists
    if (!historyItem.share_id) {
      const shareId = nanoid(10);
      await db.run(
        'UPDATE history SET share_id = ? WHERE id = ?',
        [shareId, historyId]
      );
      historyItem.share_id = shareId;
    }

    const shareLink = `${req.protocol}://${req.get('host')}/shared/${historyItem.share_id}`;
    res.json({ shareLink });
  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// Get shared history item
router.get('/api/shared/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const historyItem = await db.get(
      'SELECT text, language, created_at FROM history WHERE share_id = ?',
      [shareId]
    );

    if (!historyItem) {
      return res.status(404).json({ error: 'Shared item not found' });
    }

    res.json(historyItem);
  } catch (error) {
    console.error('Error fetching shared item:', error);
    res.status(500).json({ error: 'Failed to fetch shared item' });
  }
});

// Delete history item
router.delete('/api/history/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the history item belongs to the user
    const historyItem = await db.get(
      'SELECT * FROM history WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!historyItem) {
      return res.status(404).json({ error: 'History item not found' });
    }

    // Delete the history item
    await db.run(
      'DELETE FROM history WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    res.json({ message: 'History item deleted successfully' });
  } catch (error) {
    console.error('Error deleting history item:', error);
    res.status(500).json({ error: 'Failed to delete history item' });
  }
});

// Toggle favorite status
router.patch('/api/history/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { favorite } = req.body;
    
    // Verify the history item belongs to the user
    const historyItem = await db.get(
      'SELECT * FROM history WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!historyItem) {
      return res.status(404).json({ error: 'History item not found' });
    }

    // Update the favorite status
    await db.run(
      'UPDATE history SET favorite = ? WHERE id = ? AND user_id = ?',
      [favorite, id, req.user.id]
    );

    res.json({ message: 'Favorite status updated successfully' });
  } catch (error) {
    console.error('Error updating favorite status:', error);
    res.status(500).json({ error: 'Failed to update favorite status' });
  }
});

export default router; 