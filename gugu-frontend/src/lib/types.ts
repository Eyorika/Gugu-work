import { ReactNode } from "react";
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export enum UserRole {
    Employer = 'employer',
    Worker = 'worker'
  };
  
  export type JobPost = {
    employer: any;
    hasApplied: any;
    id: string;  
    title: string;
    description: string;
    location: string;
    salary: string;
    status: 'open' | 'closed';
    employer_id: string;
    created_at?: string;
    //applications?: { count: number };
    updated_at?: string;
    application_count?: number; 
    applications?: Application[]; 
  };

  export enum JobStatus {
    Open = 'open',
    Closed = 'closed'
  };
  export type JobPostFormProps = {
    job?: JobPost | null;
    onPost: () => void;
    onCancel: () => void;
  };
  export type Application = {
    id: string;
    job_id: string;
    worker_id: string;
    status: ApplicationStatus;
    created_at?: string;
    jobs?: {
      id: string;
      title: string;
      description: string;
      location: string;
      salary: string;
      employer_id: string;
      employer?: {
        company_name: string;
      };
    };
    worker?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      skills: string[];
      hourly_rate: number;
    };
  };