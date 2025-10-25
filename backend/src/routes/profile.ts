import express from 'express';
import jwt from 'jsonwebtoken';
import { StudentProfileModel } from '../models/StudentProfile';

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

// Get student's own profile
router.get('/me', authenticate, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'This endpoint is only for students' });
  }

  try {
    const profile = await StudentProfileModel.findByUserId(req.user.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found. Please contact administrator.' });
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// Get student profile by ID (admin/educator access)
router.get('/:userId', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'educator') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const { userId } = req.params;
    const profile = await StudentProfileModel.findByUserId(parseInt(userId));

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Failed to fetch student profile', error: error.message });
  }
});

// Get all student profiles (admin only with filtering)
router.get('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const { department, semester, section, page = '1', limit = '20' } = req.query;

    const options: any = {};
    if (department) options.department = department;
    if (semester) options.semester = parseInt(semester as string);
    if (section) options.section = section;
    if (limit) options.limit = parseInt(limit as string);
    if (page && limit) options.offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const profiles = await StudentProfileModel.findAll(options);

    // Transform to clean API format
    const transformedProfiles = profiles.map(profile => ({
      id: profile.id,
      userId: profile.userId,
      fullName: profile.fullName,
      department: profile.department,
      program: profile.program,
      semester: profile.semester,
      section: profile.section,
      studentId: profile.studentId,
      enrollmentYear: profile.enrollmentYear,
      expectedGraduationYear: profile.expectedGraduationYear,
      primaryPhone: profile.primaryPhone,
      emergencyContactName: profile.emergencyContactName,
      emergencyContactPhone: profile.emergencyContactPhone,
      profileCompleted: profile.profileCompleted,
      cgpa: profile.cgpa,
      backlogsCount: profile.backlogsCount,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    }));

    res.json({
      profiles: transformedProfiles,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        hasMore: profiles.length === parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching student profiles:', error);
    res.status(500).json({ message: 'Failed to fetch student profiles', error: error.message });
  }
});

// Create student profile (admin only)
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized. Only admins can create student profiles.' });
  }

  try {
    const profileData = req.body;

    // Validate required fields
    if (!profileData.userId || !profileData.fullName || !profileData.department || !profileData.studentId) {
      return res.status(400).json({
        message: 'Missing required fields: userId, fullName, department, studentId'
      });
    }

    // Check if user already has a profile
    const existingProfile = await StudentProfileModel.findByUserId(profileData.userId);
    if (existingProfile) {
      return res.status(400).json({ message: 'Student profile already exists for this user' });
    }

    // Check if student ID is unique
    const profiles = await StudentProfileModel.findAll();
    const studentIdExists = profiles.some(profile => profile.studentId === profileData.studentId);
    if (studentIdExists) {
      return res.status(400).json({ message: 'Student ID already exists' });
    }

    const profile = await StudentProfileModel.create(profileData);

    res.status(201).json({
      message: 'Student profile created successfully',
      profile: profile
    });
  } catch (error) {
    console.error('Error creating student profile:', error);
    res.status(500).json({ message: 'Failed to create student profile', error: error.message });
  }
});

// Update student profile (students for personal data, admins for all data)
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const updateData = req.body;

    // Authorization check
    const isStudentUpdatingOwnProfile = req.user.role === 'student' && req.user.id === userIdNum;
    const isAdminUpdating = req.user.role === 'admin';
    const isEducatorUpdating = req.user.role === 'educator' && req.user.id === userIdNum; // educators can update their own profile

    if (!isStudentUpdatingOwnProfile && !isAdminUpdating && !isEducatorUpdating) {
      return res.status(403).json({
        message: 'Unauthorized. Students can only update their own profile, admins can update all profiles.'
      });
    }

    // If student is updating, restrict fields they can modify
    if (req.user.role === 'student') {
      const allowedFields = [
        'dateOfBirth', 'gender', 'primaryPhone', 'alternatePhone', 'personalEmail',
        'permanentAddress', 'currentAddress', 'emergencyContactName', 'emergencyContactPhone',
        'profilePhotoUrl'
      ];

      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {} as any);

      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      updateData = filteredData;
    }

    const profile = await StudentProfileModel.update(userIdNum, updateData);

    if (!profile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json({
      message: 'Student profile updated successfully',
      profile: profile
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ message: 'Failed to update student profile', error: error.message });
  }
});

// Delete student profile (admin only)
router.delete('/:userId', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized. Only admins can delete student profiles.' });
  }

  try {
    const { userId } = req.params;
    const deleted = await StudentProfileModel.delete(parseInt(userId));

    if (!deleted) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json({ message: 'Student profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting student profile:', error);
    res.status(500).json({ message: 'Failed to delete student profile', error: error.message });
  }
});

// Bulk import profiles (admin only)
router.post('/bulk-import', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized. Only admins can bulk import profiles.' });
  }

  try {
    const { profiles } = req.body;

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({ message: 'Invalid profiles data. Expected an array.' });
    }

    const results = {
      successful: [] as any[],
      failed: [] as { userId?: number; error: string }[]
    };

    for (const profileData of profiles) {
      try {
        // Validate required fields
        if (!profileData.userId || !profileData.fullName || !profileData.department || !profileData.studentId) {
          results.failed.push({
            userId: profileData.userId,
            error: 'Missing required fields: userId, fullName, department, studentId'
          });
          continue;
        }

        // Check if profile already exists
        const existingProfile = await StudentProfileModel.findByUserId(profileData.userId);
        if (existingProfile) {
          results.failed.push({
            userId: profileData.userId,
            error: 'Profile already exists for this user'
          });
          continue;
        }

        // Create the profile
        const profile = await StudentProfileModel.create(profileData);
        results.successful.push(profile);
      } catch (error: any) {
        results.failed.push({
          userId: profileData.userId,
          error: error.message
        });
      }
    }

    res.json({
      message: `Bulk import completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results: results
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ message: 'Failed to perform bulk import', error: error.message });
  }
});

// Get profile statistics (admin only)
router.get('/admin/stats', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const stats = await StudentProfileModel.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    res.status(500).json({ message: 'Failed to fetch profile statistics', error: error.message });
  }
});

export default router;
