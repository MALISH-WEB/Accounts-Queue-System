/**
 * CampusQ — UCU Accounts Office Notifications Service
 * In-app financial alerts, receipt availability, ticket resolution, and queue calls.
 */

import { db } from '../db/database.js';

export class NotificationService {
  static async getUserNotifications(userId: string) {
    return await db.query<any>(
      `SELECT * FROM notifications 
       WHERE recipient_user_id = ? 
       ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const row = await db.getOne<any>(
      `SELECT COUNT(*) as count FROM notifications WHERE recipient_user_id = ? AND is_read = 0`,
      [userId]
    );
    return Number(row?.count || 0);
  }

  static async markAsRead(notificationId: string, userId: string) {
    await db.run(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_user_id = ?`,
      [notificationId, userId]
    );
    return { success: true };
  }

  static async markAllAsRead(userId: string) {
    await db.run(
      `UPDATE notifications SET is_read = 1 WHERE recipient_user_id = ?`,
      [userId]
    );
    return { success: true };
  }
}
