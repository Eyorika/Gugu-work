export enum UserRole {
    Worker = 'worker',
    Employer = 'employer'
  }
  
  export type Profile = {
    id: string;
    role: UserRole;
    completion_percent: number;
    
    full_name: string;
    username: string;
    phone: string;
    national_id: string;
    photo_url?: string;
    bio?: string;
    address: string;
    
    cosigner_email?: string;
    skills?: string[];
    hourly_rate?: number;
    
    company_name?: string;
    tin_number?: string;
    trade_license?: string;
  };

  