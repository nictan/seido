export type KarateProfile = {
  id: string;
  profileId: string;
  dojo: 'TP' | 'SIT' | 'HQ';
  isStudent: boolean;
  isInstructor: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RankHistory = {
  id: string;
  profileId: string;
  rankId: string;
  effectiveDate: string;
  isCurrent: boolean;
  createdAt: string;
  rank?: Rank;
};

export type Profile = {
  id: string;
  user_id: string; // userId from API
  first_name: string; // firstName from API
  last_name: string; // lastName from API
  date_of_birth: string; // dateOfBirth from API
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  mobile: string;
  remarks?: string;
  profile_picture_url?: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  emergency_contact_email?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  karate_profile?: KarateProfile;
  rank_histories?: RankHistory[];
};

export type Rank = {
  id: string;
  rankOrder: number;
  kyu: number | null;
  dan: number | null;
  beltColor: string;
  stripes: number;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

export type GradingConfiguration = {
  id: string;
  rank_id: string;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Grading = {
  id: string;
  student_id: string;
  requested_grade?: {
    kyu: number | null;
    dan: number | null;
    belt_color: string;
  };
  requested_rank_id?: string;
  achieved_rank_id?: string;
  status: 'Pending' | 'Pass' | 'Fail';
  application_status: 'Submitted' | 'Approved' | 'Rejected';
  submitted_at: string;
  indemnity?: {
    signed_at: string;
    signature_image_url: string;
    pdf_url: string;
  };
  grading_notes?: string;
  visible_remarks?: string;
  application_remarks?: string;
  certificate_url?: string;
  decided_by?: string;
  decided_at?: string;
  application_decided_by?: string;
  application_decided_at?: string;
  grading_period_id?: string;
  created_at: string;
  updated_at: string;
};

export type GradingPeriod = {
  id: string;
  title: string;
  description?: string;
  gradingDate: string;
  location?: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  maxApplications?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  allowedRanks?: { rank: Rank }[];
};

export type GradingApplicationStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Withdrawn' | 'Void';

export type GradingApplication = {
  id: string;
  gradingPeriodId: string;
  profileId: string;
  currentRankId: string;
  proposedRankId: string;
  status: GradingApplicationStatus;
  gradingStatus: 'Pending' | 'Pass' | 'Fail';
  gradingNotes?: string;
  instructorNotes?: string;
  createdAt: string;
  updatedAt: string;
  gradingPeriod?: GradingPeriod;
  currentRank?: Rank;
  proposedRank?: Rank;
};

export type GradingHistory = {
  id: string;
  student_id: string;
  grading_id: string;
  result: 'Pass' | 'Fail';
  remarks?: string;
  notes?: string;
  grade_after?: {
    kyu: number | null;
    dan: number | null;
    belt_color: string;
  };
  certificate_url?: string;
  decided_at: string;
  created_at: string;
};

export const BELT_COLORS = {
  10: 'White',
  9: 'White',
  8: 'Orange',
  7: 'Orange',
  6: 'Orange',
  5: 'Orange',
  4: 'Brown',
  3: 'Brown',
  2: 'Brown',
  1: 'Brown',
  0: 'Black (Shodan)'
} as const;

export const DOJOS = {
  TP: 'Temasek Polytechnic',
  SIT: 'Singapore Institute of Technology',
  HQ: 'Headquarters'
} as const;