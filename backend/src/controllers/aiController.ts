import { Request, Response } from 'express';
import { executeRAGQuery } from '../services/ragChain';

export const chatWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, contextCollegeIds } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ error: 'Message query parameter is required.' });
      return;
    }

    const { answer, retrievedColleges } = await executeRAGQuery(message, contextCollegeIds);

    res.json({
      answer,
      retrievedColleges,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('chatWithAI error:', err);
    res.status(500).json({ error: 'Failed to process AI chat query.' });
  }
};

export const getSuggestedQuestions = async (_req: Request, res: Response): Promise<void> => {
  const suggestions = [
    {
      id: '1',
      title: 'Compare Top Engineering Colleges',
      query: 'Which college is better for CSE, IIT Bombay or BITS Pilani?',
      category: 'Comparison',
    },
    {
      id: '2',
      title: 'High Placement / Best ROI',
      query: 'Show me colleges with high placement packages and reasonable annual fees',
      category: 'Placements',
    },
    {
      id: '3',
      title: 'Location & Fees Filter',
      query: 'Top colleges in Delhi with fees under ₹3 Lakhs',
      category: 'Location',
    },
    {
      id: '4',
      title: 'MBA & Management Comparison',
      query: 'Compare IIM Ahmedabad and XLRI Jamshedpur for MBA',
      category: 'Management',
    },
  ];

  res.json({ suggestions });
};
