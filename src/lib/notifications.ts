import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface NotificationData {
  id: string;
  type:
    | 'referral_submitted'
    | 'referral_approved'
    | 'referral_rejected'
    | 'commission_approved'
    | 'payout_processed'
    | 'affiliate_registered';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId: string;
  metadata?: Prisma.JsonValue;
}

class NotificationService {
  async createNotification(
    data: Omit<NotificationData, 'id' | 'timestamp' | 'read'> & { metadata?: Prisma.InputJsonValue }
  ): Promise<NotificationData> {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ?? {},
      },
    });

    return {
      id: notification.id,
      type: notification.type as NotificationData['type'],
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt.toISOString(),
      read: notification.read,
      userId: notification.userId,
      metadata: notification.metadata as Prisma.JsonValue,
    };
  }

  async getNotificationsForUser(
    userId: string
  ): Promise<NotificationData[]> {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type as NotificationData['type'],
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt.toISOString(),
      read: notification.read,
      userId: notification.userId,
      metadata: notification.metadata as Prisma.JsonValue,
    }));
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async notifyReferralSubmitted(
    referralData: {
      affiliateName: string;
      leadName: string;
      company?: string;
    },
    adminIds: string[]
  ): Promise<void> {
    await Promise.all(
      adminIds.map((adminId) =>
        this.createNotification({
          type: 'referral_submitted',
          title: 'New Referral Submitted',
          message: `${referralData.affiliateName} submitted a referral for ${referralData.leadName}${
            referralData.company
              ? ` from ${referralData.company}`
              : ''
          }`,
          userId: adminId,
          metadata: referralData,
        })
      )
    );
  }

  async notifyReferralApproved(
    affiliateId: string,
    referralData: {
      leadName: string;
      commissionAmount: number;
    }
  ): Promise<void> {
    await this.createNotification({
      type: 'referral_approved',
      title: 'Referral Approved!',
      message: `Your referral for ${referralData.leadName} has been approved. Commission: $${(
        referralData.commissionAmount / 100
      ).toFixed(2)}`,
      userId: affiliateId,
      metadata: referralData,
    });
  }

  async notifyReferralRejected(
    affiliateId: string,
    referralData: {
      leadName: string;
      reason?: string;
    }
  ): Promise<void> {
    await this.createNotification({
      type: 'referral_rejected',
      title: 'Referral Update',
      message: `Your referral for ${referralData.leadName} needs attention${
        referralData.reason ? `: ${referralData.reason}` : ''
      }`,
      userId: affiliateId,
      metadata: referralData,
    });
  }

  async notifyCommissionApproved(
    affiliateId: string,
    commissionData: {
      amount: number;
      referralName: string;
    }
  ): Promise<void> {
    await this.createNotification({
      type: 'commission_approved',
      title: 'Commission Approved!',
      message: `Commission of $${(
        commissionData.amount / 100
      ).toFixed(2)} for ${commissionData.referralName} has been approved`,
      userId: affiliateId,
      metadata: commissionData,
    });
  }

  async notifyPayoutProcessed(
    affiliateId: string,
    payoutData: {
      amount: number;
      method: string;
    }
  ): Promise<void> {
    await this.createNotification({
      type: 'payout_processed',
      title: 'Payout Processed',
      message: `Your payout of $${(
        payoutData.amount / 100
      ).toFixed(2)} via ${payoutData.method} has been processed`,
      userId: affiliateId,
      metadata: payoutData,
    });
  }

  async notifyAffiliateRegistered(
    adminIds: string[],
    affiliateData: {
      name: string;
      email: string;
    }
  ): Promise<void> {
    await Promise.all(
      adminIds.map((adminId) =>
        this.createNotification({
          type: 'affiliate_registered',
          title: 'New Affiliate Registration',
          message: `${affiliateData.name} (${affiliateData.email}) has registered as an affiliate`,
          userId: adminId,
          metadata: affiliateData,
        })
      )
    );
  }
}

export const notificationService = new NotificationService();
