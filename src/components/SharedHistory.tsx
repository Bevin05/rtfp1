import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Button, message, Spin } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface SharedHistoryItem {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
}

const SharedHistory: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [historyItem, setHistoryItem] = useState<SharedHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const fetchSharedHistory = async () => {
      try {
        const response = await fetch(`/api/share/${shareId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch shared history');
        }
        const data = await response.json();
        setHistoryItem(data);
      } catch (error) {
        message.error('Failed to load shared history item');
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedHistory();
    }
  }, [shareId]);

  const handleSpeak = async () => {
    if (!historyItem) return;

    try {
      setSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(historyItem.text);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => {
        setSpeaking(false);
        message.error('Failed to speak text');
      };
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setSpeaking(false);
      message.error('Failed to speak text');
      console.error('Speech error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!historyItem) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={4}>Shared history item not found</Title>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Card>
        <Title level={3}>Shared Text-to-Speech</Title>
        <Text style={{ display: 'block', marginBottom: '20px' }}>
          Shared on: {new Date(historyItem.createdAt).toLocaleDateString()}
        </Text>
        <div style={{ marginBottom: '20px' }}>
          <Text>{historyItem.text}</Text>
        </div>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleSpeak}
          loading={speaking}
        >
          {speaking ? 'Speaking...' : 'Speak Text'}
        </Button>
      </Card>
    </div>
  );
};

export default SharedHistory; 