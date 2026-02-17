export type NotificationSettings = {
  email: string;
  notifyOnEnded: boolean;
  notifyDaysBefore: number | null; // e.g. 2 = e-mail 2 dagen voor afloop
  weeklyDigest: boolean;
  updatedAt: string;
};

export const NOTIFY_DAYS_OPTIONS = [1, 2, 3, 5, 7] as const;
