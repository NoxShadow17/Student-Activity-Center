import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../database/postgres';

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

// Mock analytics data
const mockAnalytics = {
  totalActivities: 120,
  verifiedActivities: 85,
  pendingActivities: 15,
  rejectedActivities: 5,
  categories: {
    Academics: 40,
    Sports: 30,
    Volunteering: 20,
    Internships: 15,
    Skills: 10,
    'Co-curricular': 5,
  },
  monthlyGrowth: [
    { month: 'Jan', activities: 10 },
    { month: 'Feb', activities: 15 },
    { month: 'Mar', activities: 20 },
    { month: 'Apr', activities: 25 },
    { month: 'May', activities: 30 },
    { month: 'Jun', activities: 20 },
  ],
  engagementScore: 78, // Percentage
  topStudents: [
    { name: 'Alice Johnson', activities: 25 },
    { name: 'Bob Smith', activities: 22 },
    { name: 'Carol Davis', activities: 18 },
  ]
};

// Get student analytics
router.get('/student', authenticate, (req, res) => {
  try {
    // Mock student-specific analytics
    const analytics = {
      userId: req.user.id,
      totalActivities: 8,
      verifiedActivities: 6,
      pendingActivities: 2,
      categories: {
        Academics: 2,
        Skills: 3,
        Volunteering: 3,
      },
      recentActivity: 'Added new certification',
      streaks: {
        current: 5,
        longest: 12,
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error });
  }
});

// Get institutional analytics (faculty or admin only)
router.get('/institution', authenticate, (req, res) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const fetchInstitutionalAnalytics = async () => {
    try {
      // Get total activity statistics
      const statsQuery = `
        SELECT
          COUNT(*) as total_activities,
          COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
        FROM activities
      `;

      // Get activity distribution by category
      const categoryQuery = `
        SELECT category, COUNT(*) as count
        FROM activities
        GROUP BY category
        ORDER BY count DESC
      `;

      // Get monthly growth for last 12 months
      const monthlyQuery = `
        SELECT
          TO_CHAR(created_at, 'Mon YYYY') as month,
          COUNT(*) as activities
        FROM activities
        WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '12 months')
        GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'Mon YYYY')
        ORDER BY DATE_TRUNC('month', created_at)
      `;

      // Get top performing students with profile information
      const topStudentsQuery = `
        SELECT
          COALESCE(p.full_name, u.email) as name,
          COUNT(a.id) as activities,
          p.department,
          p.semester,
          p.section
        FROM users u
        LEFT JOIN student_profiles p ON u.id = p.user_id
        JOIN activities a ON u.id = a.student_id
        WHERE u.role = 'student'
        GROUP BY u.id, u.email, p.full_name, p.department, p.semester, p.section
        ORDER BY activities DESC
        LIMIT 5
      `;

      // Get total students count for engagement calculation
      const studentCountQuery = `
        SELECT COUNT(*) as total_students
        FROM users
        WHERE role = 'student'
      `;

      const [statsResult, categoryResult, monthlyResult, topStudentsResult, studentResult] = await Promise.all([
        pool.query(statsQuery),
        pool.query(categoryQuery),
        pool.query(monthlyQuery),
        pool.query(topStudentsQuery),
        pool.query(studentCountQuery)
      ]);

      const stats = statsResult.rows[0];
      const categories: { [key: string]: number } = {};
      categoryResult.rows.forEach((row: any) => {
        categories[row.category] = parseInt(row.count);
      });

      // Ensure we have data for the last 12 months even if empty
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyGrowth = months.map(month => ({ month, activities: 0 }));

      // Replace with actual data where available (row.month format: 'Jan 2025')
      monthlyResult.rows.forEach((row: any) => {
        const monthName = row.month.split(' ')[0]; // Get just 'Jan' from 'Jan 2025'
        const monthIndex = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        if (monthIndex !== -1) {
          monthlyGrowth[monthIndex].activities = parseInt(row.activities);
        }
      });

      const topStudents = topStudentsResult.rows.map(row => ({
        name: row.name.split('@')[0], // Use part before @ as name
        activities: parseInt(row.activities)
      }));

      // Fill with placeholder if no real data
      if (topStudents.length === 0) {
        topStudents.push(
          { name: 'No students yet', activities: 0 },
          { name: 'Add first student', activities: 0 }
        );
      }

      // Calculate engagement score based on activity frequency
      const totalStudents = parseInt(studentResult.rows[0].total_students);
      const totalActivities = parseInt(stats.total_activities);
      const avgActivitiesPerStudent = totalStudents > 0 ? totalActivities / totalStudents : 0;

      // Engagement score formula: higher is better (capped at 100)
      const engagementScore = Math.min(100, Math.round(avgActivitiesPerStudent * 20));

      const analytics = {
        totalActivities: parseInt(stats.total_activities),
        verifiedActivities: parseInt(stats.verified),
        pendingActivities: parseInt(stats.pending),
        rejectedActivities: parseInt(stats.rejected),
        totalStudents: parseInt(studentResult.rows[0].total_students),
        categories,
        monthlyGrowth,
        engagementScore,
        topStudents
      };

      res.json(analytics);

    } catch (error) {
      console.error('Error fetching institutional analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
    }
  };

  fetchInstitutionalAnalytics();
});

// AI-powered insights
router.get('/insights', authenticate, (req, res) => {
  try {
    const insights = [
      'Consider adding leadership activities to balance your profile.',
      'Your volunteering hours exceed the average - highlight this in your portfolio.',
      'Based on your activities, you might be interested in Data Science internships.'
    ];

    res.json({ insights });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch insights', error });
  }
});

export default router;
