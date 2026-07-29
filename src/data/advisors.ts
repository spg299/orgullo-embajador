export interface Advisor {
  id: string;
  profile_id: string | null;
  name: string;
  avatar_url: string | null;
  color: string;
  active: boolean;
  created_at: string;
}
