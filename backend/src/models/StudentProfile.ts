import { pool } from '../database/postgres';

export interface StudentProfile {
  id: number;
  userId: number;
  fullName: string;
  department: string;
  program?: string;
  semester?: number;
  section?: string;
  studentId: string;
  enrollmentYear?: number;
  expectedGraduationYear?: number;
  dateOfBirth?: Date;
  gender?: string;
  primaryPhone?: string;
  alternatePhone?: string;
  personalEmail?: string;
  permanentAddress?: string;
  currentAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  specialization?: string;
  cgpa?: number;
  backlogsCount?: number;
  profileCompleted?: boolean;
  profilePhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class StudentProfileModel {
  static async create(profileData: {
    userId: number;
    fullName: string;
    department: string;
    program?: string;
    semester?: number;
    section?: string;
    studentId: string;
    enrollmentYear?: number;
    expectedGraduationYear?: number;
    dateOfBirth?: Date;
    gender?: string;
    primaryPhone?: string;
    alternatePhone?: string;
    personalEmail?: string;
    permanentAddress?: string;
    currentAddress?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    specialization?: string;
    cgpa?: number;
    backlogsCount?: number;
    profilePhotoUrl?: string;
  }): Promise<StudentProfile> {
    const query = `
      INSERT INTO student_profiles (
        user_id, full_name, department, program, semester, section, student_id,
        enrollment_year, expected_graduation_year, date_of_birth, gender,
        primary_phone, alternate_phone, personal_email,
        permanent_address, current_address,
        emergency_contact_name, emergency_contact_phone,
        specialization, cgpa, backlogs_count, profile_photo_url,
        profile_completed, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW()
      )
      RETURNING *
    `;

    const values = [
      profileData.userId,
      profileData.fullName,
      profileData.department,
      profileData.program,
      profileData.semester,
      profileData.section,
      profileData.studentId,
      profileData.enrollmentYear,
      profileData.expectedGraduationYear,
      profileData.dateOfBirth,
      profileData.gender,
      profileData.primaryPhone,
      profileData.alternatePhone,
      profileData.personalEmail,
      profileData.permanentAddress,
      profileData.currentAddress,
      profileData.emergencyContactName,
      profileData.emergencyContactPhone,
      profileData.specialization,
      profileData.cgpa,
      profileData.backlogsCount || 0,
      profileData.profilePhotoUrl,
      false // profile_completed starts as false
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId: number): Promise<StudentProfile | null> {
    const query = 'SELECT * FROM student_profiles WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  static async findAll(options?: {
    department?: string;
    semester?: number;
    section?: string;
    limit?: number;
    offset?: number;
  }): Promise<StudentProfile[]> {
    let query = 'SELECT * FROM student_profiles WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (options?.department) {
      query += ` AND department = $${paramIndex}`;
      values.push(options.department);
      paramIndex++;
    }

    if (options?.semester) {
      query += ` AND semester = $${paramIndex}`;
      values.push(options.semester);
      paramIndex++;
    }

    if (options?.section) {
      query += ` AND section = $${paramIndex}`;
      values.push(options.section);
      paramIndex++;
    }

    query += ` ORDER BY full_name ASC`;

    if (options?.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(options.limit);
      paramIndex++;
    }

    if (options?.offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(options.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async update(userId: number, profileData: Partial<Omit<StudentProfile, 'id' | 'userId' | 'createdAt'>>): Promise<StudentProfile | null> {
    // Check if profile exists
    const existingProfile = await this.findByUserId(userId);
    if (!existingProfile) {
      return null;
    }

    // Build update query dynamically
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(profileData).forEach(key => {
      if (profileData[key as keyof typeof profileData] !== undefined) {
        const dbColumn = this.convertToDbColumn(key);
        fieldsToUpdate.push(`${dbColumn} = $${paramIndex}`);
        values.push(profileData[key as keyof typeof profileData]);
        paramIndex++;
      }
    });

    // Add profile_completed calculation based on required fields
    if (this.hasRequiredFields(profileData, existingProfile)) {
      fieldsToUpdate.push(`profile_completed = $${paramIndex}`);
      values.push(true);
      paramIndex++;
    }

    if (fieldsToUpdate.length === 0) {
      return existingProfile;
    }

    fieldsToUpdate.push(`updated_at = NOW()`);

    const query = `
      UPDATE student_profiles
      SET ${fieldsToUpdate.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    values.push(userId);
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(userId: number): Promise<boolean> {
    const query = 'DELETE FROM student_profiles WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return (result.rowCount || 0) > 0;
  }

  static async getStats(): Promise<{
    totalProfiles: number;
    completedProfiles: number;
    departmentStats: { department: string; count: number }[];
    semesterStats: { semester: number; count: number }[];
  }> {
    const [totalResult, completedResult, deptResult, semesterResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM student_profiles'),
      pool.query('SELECT COUNT(*) as completed FROM student_profiles WHERE profile_completed = true'),
      pool.query('SELECT department, COUNT(*) as count FROM student_profiles GROUP BY department ORDER BY count DESC'),
      pool.query('SELECT semester, COUNT(*) as count FROM student_profiles WHERE semester IS NOT NULL GROUP BY semester ORDER BY semester')
    ]);

    return {
      totalProfiles: parseInt(totalResult.rows[0].total),
      completedProfiles: parseInt(completedResult.rows[0].completed),
      departmentStats: deptResult.rows.map(row => ({
        department: row.department,
        count: parseInt(row.count)
      })),
      semesterStats: semesterResult.rows.map(row => ({
        semester: row.semester,
        count: parseInt(row.count)
      }))
    };
  }

  private static convertToDbColumn(field: string): string {
    // Convert camelCase to snake_case for database columns
    return field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private static hasRequiredFields(newData: Partial<StudentProfile>, existingData: StudentProfile): boolean {
    // Check if profile has all required fields for completion
    const requiredFields = ['primaryPhone', 'emergencyContactName', 'emergencyContactPhone'];

    for (const field of requiredFields) {
      const value = newData[field as keyof typeof newData] || existingData[field as keyof StudentProfile];
      if (!value) {
        return false;
      }
    }

    return true;
  }
}
