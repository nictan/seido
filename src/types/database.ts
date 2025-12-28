export type Profile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  mobile: string;
  dojo: 'TP' | 'SIT' | 'HQ';
  remarks?: string;
  profile_picture_url?: string;
  is_student: boolean;
  is_instructor: boolean;
  is_admin: boolean;
  current_grade?: {
    kyu: number | null;
    dan: number | null;
    belt_color: string;
    effective_date?: string;
  };
  current_rank_id?: string;
  rank_effective_date?: string;
  created_at: string;
  updated_at: string;
};

export type Rank = {
  id: string;
  rank_order: number;
  kyu: number | null;
  dan: number | null;
  belt_color: string;
  stripes: number;
  display_name: string;
  created_at: string;
  updated_at: string;
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
  grading_date: string;
  location?: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  max_applications?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
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