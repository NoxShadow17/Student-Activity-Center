import { pool } from '../database/postgres';
import { QRService } from '../services/qrService';

export interface Activity {
  id: number;
  student_id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  status: 'pending' | 'verified' | 'rejected';
  proof?: string;
  verified_by?: number;
  verified_at?: string;
  qr_code_url?: string;
  qr_generated_at?: string;
  created_at: Date;
  updated_at: Date;
}

export class ActivityModel {
  static async create(activityData: {
    studentId: number;
    title: string;
    description: string;
    category: string;
    date: string;
    proof?: string;
  }): Promise<Activity> {
    const query = `
      INSERT INTO activities (student_id, title, description, category, date, proof, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      activityData.studentId,
      activityData.title,
      activityData.description,
      activityData.category,
      activityData.date,
      activityData.proof
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByStudentId(studentId: number): Promise<Activity[]> {
    const query = 'SELECT * FROM activities WHERE student_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [studentId]);

    return result.rows;
  }

  static async findAll(): Promise<Activity[]> {
    const query = 'SELECT * FROM activities ORDER BY created_at DESC';
    const result = await pool.query(query);

    return result.rows;
  }

  static async findById(id: number): Promise<Activity | null> {
    const query = 'SELECT * FROM activities WHERE id = $1';
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  }

  static async updateStatus(id: number, status: 'pending' | 'verified' | 'rejected', verifiedBy?: number): Promise<Activity | null> {
    try {
      // First get the activity to access student_id for QR generation
      const activity = await this.findById(id);
      if (!activity) {
        return null;
      }

      let qrUpdate = '';
      let qrValue = '';
      let qrTimestamp = '';

      // Generate QR code if status is being changed to 'verified'
      if (status === 'verified') {
        const qrCodeUrl = await QRService.generateActivityQR(id);
        qrUpdate = ', qr_code_url = $4, qr_generated_at = NOW()';
        qrValue = qrCodeUrl;
        console.log(`Generated QR code for activity ${id}`);
      } else if (status === 'pending' || status === 'rejected') {
        // Clear QR code for non-verified statuses
        qrUpdate = ', qr_code_url = NULL, qr_generated_at = NULL';
      }

      const query = `
        UPDATE activities
        SET status = $1::VARCHAR(50), verified_by = $2, verified_at = CASE WHEN $1::VARCHAR(50) = 'verified' OR $1::VARCHAR(50) = 'rejected' THEN NOW() ELSE NULL END, updated_at = NOW()${qrUpdate}
        WHERE id = $3
        RETURNING *
      `;

      const values = qrValue ? [status, verifiedBy, id, qrValue] : [status, verifiedBy, id];
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating activity status:', error);
      throw error;
    }
  }

  static async getStats(): Promise<{
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM activities
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      pending: parseInt(row.pending),
      verified: parseInt(row.verified),
      rejected: parseInt(row.rejected)
    };
  }
}
