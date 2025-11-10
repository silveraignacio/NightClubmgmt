import { query } from '../config/database';
import logger from '../utils/logger';

export interface SendNotificationData {
  clubId: string;
  memberId: string;
  notificationType: string;
  title: string;
  body: string;
  actionUrl?: string;
  imageUrl?: string;
  data?: any;
  deliveryMethod?: 'push' | 'email' | 'sms';
}

export const sendNotification = async (data: SendNotificationData) => {
  const {
    clubId,
    memberId,
    notificationType,
    title,
    body,
    actionUrl,
    imageUrl,
    data: additionalData,
    deliveryMethod = 'push',
  } = data;

  try {
    // Store notification in database
    await query(
      `INSERT INTO notifications (club_id, member_id, notification_type, title, body, action_url, image_url, data, delivery_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        clubId,
        memberId,
        notificationType,
        title,
        body,
        actionUrl,
        imageUrl,
        JSON.stringify(additionalData || {}),
        deliveryMethod,
      ]
    );

    // Get member's FCM token if sending push notification
    if (deliveryMethod === 'push') {
      const memberResult = await query(
        'SELECT fcm_token, notifications_enabled FROM club_members WHERE id = $1',
        [memberId]
      );

      if (memberResult.rows.length > 0) {
        const member = memberResult.rows[0];

        if (member.notifications_enabled && member.fcm_token) {
          // Here you would integrate with Firebase Cloud Messaging
          // For now, we'll log it
          logger.info('Push notification would be sent:', {
            fcmToken: member.fcm_token,
            title,
            body,
          });

          // TODO: Integrate Firebase Admin SDK
          // const message = {
          //   notification: { title, body },
          //   token: member.fcm_token,
          //   data: additionalData,
          // };
          // await admin.messaging().send(message);
        }
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('Failed to send notification:', error);
    throw error;
  }
};

export const getUnreadNotifications = async (memberId: string, limit: number = 20) => {
  const result = await query(
    `SELECT * FROM notifications
     WHERE member_id = $1 AND read_at IS NULL
     ORDER BY sent_at DESC
     LIMIT $2`,
    [memberId, limit]
  );

  return result.rows;
};

export const markNotificationAsRead = async (notificationId: string, memberId: string) => {
  await query(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = $1 AND member_id = $2',
    [notificationId, memberId]
  );
};

export const markAllNotificationsAsRead = async (memberId: string) => {
  await query(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE member_id = $1 AND read_at IS NULL',
    [memberId]
  );
};

// Predefined notification templates
export const notificationTemplates = {
  welcome: (memberName: string, clubName: string) => ({
    title: `¡Bienvenido a ${clubName}!`,
    body: `Hola ${memberName}, gracias por registrarte. Empieza a acumular puntos con cada visita y compra.`,
  }),
  visitConfirmed: (clubName: string, pointsEarned: number) => ({
    title: '¡Entrada confirmada!',
    body: `Bienvenido a ${clubName}. ${pointsEarned > 0 ? `Has ganado ${pointsEarned} puntos.` : ''}`,
  }),
  purchaseCompleted: (amount: number, pointsEarned: number, newBalance: number) => ({
    title: '¡Compra registrada!',
    body: `Compra de $${amount.toFixed(2)}. Has ganado ${pointsEarned} puntos. Balance: ${newBalance} pts.`,
  }),
  rewardUnlocked: (rewardName: string) => ({
    title: '🎉 ¡Recompensa desbloqueada!',
    body: `Has desbloqueado: ${rewardName}. Ve a tu perfil para canjearlo.`,
  }),
  badgeEarned: (badgeName: string) => ({
    title: '🏆 ¡Insignia ganada!',
    body: `Has ganado la insignia: ${badgeName}`,
  }),
  eventReminder: (eventName: string, eventDate: string) => ({
    title: `Recordatorio: ${eventName}`,
    body: `No olvides que ${eventName} es ${eventDate}. ¡Te esperamos!`,
  }),
  promotionAlert: (promotionName: string, discount: string) => ({
    title: '🎁 Nueva promoción',
    body: `${promotionName}: ${discount}. ¡Aprovecha ahora!`,
  }),
  birthday: (memberName: string) => ({
    title: '🎂 ¡Feliz cumpleaños!',
    body: `¡Feliz cumpleaños ${memberName}! Hoy tienes entrada gratis y un regalo especial.`,
  }),
};
