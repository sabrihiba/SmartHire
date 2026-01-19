export interface Message {
  id: string;
  applicationId: string;
  senderId: string; // recruiterId ou userId
  senderRole: 'recruiter' | 'candidate';
  message: string;
  createdAt: string;
  read: boolean;
}

