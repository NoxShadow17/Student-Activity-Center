import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get portfolio data
router.get('/', authenticate, (req, res) => {
  try {
    // Mock portfolio data - in real app, aggregate from activities
    const portfolio = {
      studentId: req.user.id,
      name: 'John Doe', // From database
      email: req.user.email,
      activities: [], // Fetch from database
      verifiedCount: 5, // Calculate
      totalHours: 120, // Calculate
      categories: {
        Academics: 2,
        Sports: 1,
        Volunteering: 1,
        Internships: 1,
        Skills: 2,
        'Co-curricular': 1,
      }
    };

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch portfolio', error });
  }
});

// Export portfolio as JSON
router.get('/export', authenticate, (req, res) => {
  try {
    const portfolio = {
      studentId: req.user.id,
      exportDate: new Date().toISOString(),
      resume: 'Generated resume data', // In real app, generate PDF/clone
      badges: ['Verified Student', 'Community Helper'],
      activities: [] // Real data
    };

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Export failed', error });
  }
});

export default router;
