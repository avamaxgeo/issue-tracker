export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  user_id: string;
  created_at: string;
} 