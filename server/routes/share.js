import express from 'express';
import { db } from '../database.mjs';
import { generateShareId, isValidShareId, createShareToken, validateShareToken } from '../utils/share.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a share link for a history item
router.post('/create/:historyId', authenticateToken, async (req, res) => {
  try {
    const { historyId } = req.params;
    const userId = req.user.id;

    // Get the history item
    const historyItem = await db.get(
      'SELECT * FROM history WHERE id = ? AND user_id = ?',
      [historyId, userId]
    );

    if (!historyItem) {
      return res.status(404).json({ error: 'History item not found' });
    }

    // Generate a new share ID if one doesn't exist
    if (!historyItem.share_id) {
      const shareId = generateShareId();
      await db.run(
        'UPDATE history SET share_id = ? WHERE id = ?',
        [shareId, historyId]
      );
      historyItem.share_id = shareId;
    }

    // Create a share token
    const shareToken = createShareToken(historyItem, historyItem.share_id);

    res.json({
      shareToken,
      shareUrl: `/shared/${shareToken}`
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Get a shared history item
router.get('/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const [shareId] = shareToken.split('.');

    if (!isValidShareId(shareId)) {
      return res.status(400).json({ error: 'Invalid share token' });
    }

    // Get the history item
    const historyItem = await db.get(
      'SELECT * FROM history WHERE share_id = ?',
      [shareId]
    );

    if (!historyItem) {
      return res.status(404).json({ error: 'Shared item not found' });
    }

    // Validate the share token
    if (!validateShareToken(shareToken, historyItem)) {
      return res.status(400).json({ error: 'Invalid share token' });
    }

    // Return the shared item without sensitive information
    const { id, text, language, created_at } = historyItem;
    res.json({ id, text, language, created_at });
  } catch (error) {
    console.error('Error getting shared item:', error);
    res.status(500).json({ error: 'Failed to get shared item' });
  }
});

// Remove sharing for a history item
router.delete('/:historyId', authenticateToken, async (req, res) => {
  try {
    const { historyId } = req.params;
    const userId = req.user.id;

    const result = await db.run(
      'UPDATE history SET share_id = NULL WHERE id = ? AND user_id = ?',
      [historyId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'History item not found' });
    }

    res.json({ message: 'Sharing removed successfully' });
  } catch (error) {
    console.error('Error removing share:', error);
    res.status(500).json({ error: 'Failed to remove sharing' });
  }
});

export default router; 