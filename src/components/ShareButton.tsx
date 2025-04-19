import React, { useState } from 'react';
import { Button, Modal, message } from 'antd';
import { ShareAltOutlined, CopyOutlined } from '@ant-design/icons';

interface ShareButtonProps {
  historyId: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ historyId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/share/create/${historyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setIsModalVisible(true);
    } catch (error) {
      message.error('Failed to create share link');
      console.error('Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success('Share link copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy link');
      console.error('Copy error:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Button
        icon={<ShareAltOutlined />}
        onClick={handleShare}
        loading={loading}
        type="text"
        aria-label="Share history item"
      >
        Share
      </Button>

      <Modal
        title="Share Link"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="copy" onClick={handleCopy} icon={<CopyOutlined />}>
            Copy Link
          </Button>,
          <Button key="close" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        <p>Share this link with others to let them view this history item:</p>
        <p style={{ wordBreak: 'break-all' }}>{shareUrl}</p>
      </Modal>
    </>
  );
};

export default ShareButton; 