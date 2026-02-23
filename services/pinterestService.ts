
const PINTEREST_ACCESS_TOKEN = '73a7d9714bd962bf2add127146721f23e636d2ab';
const BASE_URL = 'https://api.pinterest.com/v5';

export interface PinterestPinData {
  title: string;
  description: string;
  boardId: string;
  link?: string;
  imageData: string; // Base64 without prefix
  publishAt?: string; // ISO 8601 string for scheduling
}

export const createPinterestPin = async (data: PinterestPinData) => {
  const payload: any = {
    title: data.title,
    description: data.description,
    board_id: data.boardId,
    link: data.link || 'https://pingenius.ai',
    media_source: {
      source_type: 'image_base64',
      content_type: 'image/png',
      data: data.imageData,
    },
  };

  if (data.publishAt) {
    payload.publish_at = data.publishAt;
  }

  const response = await fetch(`${BASE_URL}/pins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create Pinterest pin');
  }

  return response.json();
};

export const fetchPinterestBoards = async () => {
  const response = await fetch(`${BASE_URL}/boards`, {
    headers: {
      'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Pinterest boards');
  }

  const data = await response.json();
  return data.items || [];
};
