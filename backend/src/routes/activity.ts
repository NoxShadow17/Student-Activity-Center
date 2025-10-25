import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { ActivityModel } from '../models/Activity';
import { pool } from '../database/postgres';

const router = express.Router();

// Declare extended Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify JWT
const authenticate = (req: Request, res: Response, next: NextFunction) => {
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

// Add activity
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, date, proof } = req.body;

    if (!title || !description || !category || !date) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const activity = await ActivityModel.create({
      studentId: req.user.id,
      title,
      description,
      category,
      date,
      proof
    });

    res.status(201).json({
      message: 'Activity added successfully',
      activity: {
        ...activity,
        studentId: activity.student_id
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add activity', error });
  }
});

// Get activities for student
router.get('/student', authenticate, async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentActivities = await ActivityModel.findByStudentId(studentId);

    const formattedActivities = studentActivities.map(activity => ({
      ...activity,
      studentId: activity.student_id
    }));

    res.json(formattedActivities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activities', error });
  }
});

// Get all activities (for educator)
router.get('/', authenticate, async (req, res) => {
  if (req.user.role !== 'educator') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const activities = await ActivityModel.findAll();
    const formattedActivities = activities.map(activity => ({
      ...activity,
      studentId: activity.student_id
    }));

    res.json(formattedActivities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activities', error });
  }
});

// Update activity status (for educator)
router.patch('/:id/status', authenticate, async (req, res) => {
  if (req.user.role !== 'educator') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Attempting to update activity:', { id, status, userId: req.user.id });

    const activity = await ActivityModel.updateStatus(parseInt(id), status, req.user.id);

    if (!activity) {
      console.log('Activity not found:', id);
      return res.status(404).json({ message: 'Activity not found' });
    }

    console.log('Activity updated successfully:', activity);

    const formattedActivity = {
      ...activity,
      studentId: activity.student_id
    };

    res.json({
      message: 'Activity status updated',
      activity: formattedActivity
    });
  } catch (error) {
    console.error('Error updating activity status:', error);
    res.status(500).json({ message: 'Failed to update activity', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Public verification route (no auth required for QR code scanning)
router.get('/verify/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hash } = req.query;

    const activityId = parseInt(id);
    if (isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    // Get activity with related data
    const query = `
      SELECT
        a.*,
        u.email as student_email,
        v.email as verifier_email
      FROM activities a
      LEFT JOIN users u ON a.student_id = u.id
      LEFT JOIN users v ON a.verified_by = v.id
      WHERE a.id = $1 AND a.status = 'verified'
    `;

    const result = await pool.query(query, [activityId]);

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Certificate not found or activity not verified',
        message: 'This activity certificate does not exist or the activity has not been verified yet.'
      });
    }

    const activity = result.rows[0];

    // Return certificate data for public viewing
    res.json({
      certificate: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        category: activity.category,
        date: activity.date,
        status: activity.status,
        verifiedAt: activity.verified_at,
        studentEmail: activity.student_email,
        verifiedBy: activity.verifier_email,
        proof: activity.proof,
        qrGeneratedAt: activity.qr_generated_at
      },
      institution: "Student Activity Portal",
      verificationUrl: `http://localhost:3000/verify/activity/${activityId}`,
      validUntil: null // Could add expiration logic
    });

  } catch (error: any) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Unable to retrieve certificate. Please try again later.'
    });
  }
});

export default router;
