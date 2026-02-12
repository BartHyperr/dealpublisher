export type DealStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ENDED";

export type Deal = {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  category: string[]; // chips e.g. ["Stedentrip","Wellness"]
  postText: string; // “Facebook post tekst”
  generate: "Yes" | "No";
  publish: boolean; // toggle
  postDate?: string; // ISO date-time or ISO date
  promotionDays: 5 | 7 | 14 | 21 | 30;
  promotionEndDate?: string; // ISO date
  daysRemaining?: number;
  status: DealStatus;
  createdAt: string;
  updatedAt: string;
};

