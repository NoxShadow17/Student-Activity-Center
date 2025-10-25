import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { UserModel } from '../models/User';
import { StudentProfileModel } from '../models/StudentProfile';

const router = express.Router();

// Configure multer for file uploads (Excel and CSV)
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExcel = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    const allowedCsv = [
      'text/csv',
      'application/csv',
      'text/comma-separated-values'
    ];

    if (allowedExcel.includes(file.mimetype) || allowedCsv.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)'));
    }
  }
});

// Helper function to parse CSV content
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 1) return [];

  const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(value => value.replace(/"/g, '').trim());
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (value && value !== 'null' && value !== 'undefined' && value !== '') {
          row[header] = value;
        }
      });
      data.push(row);
    }
  }

  return data;
};

// Initialize default admin if no users exist (for demo purposes)
const initializeDefaultAdmin = async () => {
  try {
    const adminExists = await UserModel.findByEmail('admin@school.edu');
    if (!adminExists) {
      const defaultAdminPassword = await bcrypt.hash('admin123', 10);
      await UserModel.create('admin@school.edu', defaultAdminPassword, 'admin');
      console.log('🎓 Default admin account created: admin@school.edu / admin123');
      console.log('⚠️  This is for demo purposes only! Change the password in production.');
    }
  } catch (error) {
    console.error('Failed to create default admin:', error);
  }
};

// Initialize admin on module load
initializeDefaultAdmin();

// Register endpoint - now only accessible to admin
router.post('/register', async (req, res) => {
  // Only authenticated users can register (admin manages users)
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader?.split(' ')[1];

  if (!token) {
    console.log('No auth token provided for register');
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    if (decoded.role !== 'admin') {
      console.log('Non-admin user tried to register:', decoded.email);
      return res.status(403).json({ message: 'Only admin can create users' });
    }

    const { email, password, role = 'student' } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role required' });
    }

    // Validate role
    if (!['admin', 'educator', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user exists
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await UserModel.create(email, hashedPassword, role as 'admin' | 'educator' | 'student');

    res.status(201).json({
      message: `User created successfully`,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'User creation failed', error });
  }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can view users' });
    }

    const users = await UserModel.findAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete users' });
    }

    const userId = parseInt(req.params.id);
    const userToDelete = await UserModel.findById(userId);

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (userToDelete.role === 'admin') {
      const counts = await UserModel.countByRole();
      if (counts.admin === 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    const deleted = await UserModel.delete(userId);

    if (deleted) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
});

// Bulk user import with Excel or CSV file (admin only)
router.post('/bulk-import', upload.single('excelFile'), async (req, res) => {
  // Authenticate admin
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can perform bulk import' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let jsonData: any[] = [];

    // Detect file type and parse accordingly
    const fileName = req.file.originalname.toLowerCase();
    const isCSV = fileName.endsWith('.csv') || req.file.mimetype.includes('csv');

    if (isCSV) {
      // Parse CSV file
      const csvText = req.file.buffer.toString('utf-8');
      jsonData = parseCSV(csvText);

      if (!jsonData || jsonData.length === 0) {
        return res.status(400).json({ message: 'CSV file is empty or invalid' });
      }
    } else {
      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (!jsonData || jsonData.length === 0) {
        return res.status(400).json({ message: 'Excel file is empty or invalid' });
      }
    }

    const results = {
      successful: [] as any[],
      failed: [] as { row: number; email?: string; error: string }[]
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // Excel rows start at 1, add header row

      try {
        // Validate required fields for user account
        const email = row.email || row.Email;
        const password = row.password || row.Password;
        const role = row.role || row.Role;

        if (!email || !password || !role) {
          results.failed.push({
            row: rowNumber,
            email: email,
            error: 'Missing required fields: email, password, role'
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed.push({
            row: rowNumber,
            email,
            error: 'Invalid email format'
          });
          continue;
        }

        // Validate role
        if (!['admin', 'educator', 'student'].includes(role.toLowerCase())) {
          results.failed.push({
            row: rowNumber,
            email,
            error: 'Invalid role. Must be admin, educator, or student'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
          results.failed.push({
            row: rowNumber,
            email,
            error: 'User with this email already exists'
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password.toString(), 10);

        // Create user account
        const user = await UserModel.create(email, hashedPassword, role.toLowerCase() as 'admin' | 'educator' | 'student');

        // Prepare profile data if available (only for student and educator roles)
        if (role.toLowerCase() === 'student' || role.toLowerCase() === 'educator') {
          const fullName = row.fullName || row.FullName;
          const department = row.department || row.Department;
          const studentId = row.studentId || row.StudentId;
          const semester = row.semester || row.Semester;
          const section = row.section || row.Section;
          const program = row.program || row.Program;
          const enrollmentYear = row.enrollmentYear || row.EnrollmentYear;
          const expectedGraduationYear = row.expectedGraduationYear || row.ExpectedGraduationYear;

          // Check if we have enough data to create a profile
          if (fullName && department) {
            try {
              // Check if student ID is unique (only if provided)
              if (studentId) {
                const existingProfiles = await StudentProfileModel.findAll();
                const studentIdExists = existingProfiles.some(profile => profile.studentId === studentId);
                if (studentIdExists) {
                  results.failed.push({
                    row: rowNumber,
                    email,
                    error: `Student ID ${studentId} already exists`
                  });

                  // Delete the created user since profile creation failed
                  await UserModel.delete(user.id);
                  continue;
                }
              }

              // Create student profile
              const profileData: any = {
                userId: user.id,
                fullName,
                department,
                program: program || 'B.Tech CSE',
                semester: semester ? parseInt(semester) : undefined,
                section: section || 'A',
                studentId: studentId || '',
                enrollmentYear: enrollmentYear ? parseInt(enrollmentYear) : undefined,
                expectedGraduationYear: expectedGraduationYear ? parseInt(expectedGraduationYear) : undefined
              };

              await StudentProfileModel.create(profileData);

            } catch (profileError: any) {
              console.error(`Failed to create profile for user ${email}:`, profileError);
              // Note: User account is still created, but profile failed
            }
          }
        }

        results.successful.push({
          userId: user.id,
          email: user.email,
          role: user.role,
          row: rowNumber
        });

      } catch (error: any) {
        results.failed.push({
          row: rowNumber,
          email: row.email || row.Email,
          error: error.message || 'Unknown error'
        });
      }
    }

    res.json({
      message: `Bulk import completed: ${results.successful.length} users created successfully, ${results.failed.length} failed`,
      results: results,
      summary: {
        totalProcessed: jsonData.length,
        successful: results.successful.length,
        failed: results.failed.length
      }
    });

  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Bulk import failed', error: error.message });
  }
});

export default router;
