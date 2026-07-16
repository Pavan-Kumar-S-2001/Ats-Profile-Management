export interface Recruiter {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  oneDriveFolderName: string;
  folderPath: string;
  status: 'Active' | 'Inactive';
  syncStatus: 'Never Synced' | 'Syncing' | 'Synced' | 'Failed';
  uploadCount: number;
  lastUpload?: string | null;
  lastSyncAt?: string | null;
  createdDate: string;
}

export interface Resume {
  id: string;
  candidateName?: string | null;
  fileName: string;
  recruiterId: string;
  recruiter?: { name: string };
  oneDriveItemId: string;
  oneDriveWebUrl?: string | null;
  downloadUrl?: string | null;
  fileSizeBytes: number;
  pageCount?: number | null;
  processingStatus: 'Pending' | 'Processing' | 'Processed' | 'Failed';
  isDuplicate: boolean;
  uploadDate: string;
}

export interface PublicSummary {
  totalRecruiters: number;
  totalResumes: number;
  totalProcessed: number;
  pendingProcessing: number;
  todayUploads: number;
  weekUploads: number;
  monthUploads: number;
  lastSyncTime: string | null;
  recentRecruiters: Recruiter[];
}

export interface ChartPoint {
  month?: string;
  name?: string;
  uploads?: number;
  value?: number;
}

export interface AdminSummary {
  totalRecruiters: number;
  totalUploadedPdfs: number;
  totalProcessed: number;
  pending: number;
  failed: number;
  duplicates: number;
  storageUsedBytes: number;
  latestUploads: Resume[];
  recentRecruiters: Recruiter[];
  topRecruiter: { name: string; uploads: number } | null;
  averageUploads: number;
  inactiveRecruiters: number;
  successRate: number;
  charts: {
    monthlyTrend: ChartPoint[];
    recruiterComparison: ChartPoint[];
    processingStatus: ChartPoint[];
  };
}

export interface LogEntry {
  id: string;
  type: string;
  message: string;
  recruiterId?: string | null;
  createdAt: string;
}

export interface AppSettings {
  MS_TENANT_ID?: string;
  MS_CLIENT_ID?: string;
  MS_CLIENT_SECRET?: string;
  MS_DRIVE_ID?: string;
  MS_PARENT_FOLDER?: string;
  SYNC_INTERVAL_MINUTES?: string;
}
