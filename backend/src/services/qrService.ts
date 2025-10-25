import QRCode from 'qrcode';
import crypto from 'crypto';

export class QRService {
  /**
   * Generate QR code URL for activity verification
   * @param activityId - The activity ID
   * @returns Data URL of the QR code image
   */
  static async generateActivityQR(activityId: number): Promise<string> {
    try {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify/activity/${activityId}`;

      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate verification hash for additional security
   * @param activityId - The activity ID
   * @param studentId - The student ID
   * @returns Verification hash
   */
  static generateVerificationHash(activityId: number, studentId: number): string {
    const secret = process.env.JWT_SECRET || 'secret';
    const data = `${activityId}-${studentId}-${Date.now()}`;
    return crypto.createHash('sha256').update(data + secret).digest('hex').substring(0, 16);
  }

  /**
   * Get secure verification URL with hash
   * @param activityId - The activity ID
   * @param studentId - The student ID
   * @returns Secure verification URL
   */
  static getSecureVerificationUrl(activityId: number, studentId: number): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const hash = this.generateVerificationHash(activityId, studentId);
    return `${baseUrl}/verify/activity/${activityId}?hash=${hash}`;
  }
}
