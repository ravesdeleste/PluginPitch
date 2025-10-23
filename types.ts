import { Timestamp } from 'firebase/firestore';

export { Timestamp };

export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface Vote {
  id: string;
  projectId: string;
  userId: string;
  weight: number;
  timestamp: Timestamp;
}

export interface Winner {
  winnerId: string | null;
  announcedAt: Timestamp | null;
}

export interface UserVoteInfo {
    projectId: string;
    isJury: boolean;
}