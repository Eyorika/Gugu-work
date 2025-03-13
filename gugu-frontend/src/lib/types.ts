import { ReactNode } from "react";

export enum UserRole {
    Employer = 'employer',
    Worker = 'worker'
  }
  
  export type JobPost = {
    [x: string]: ReactNode;
    id?: string;
    title: string;
    description: string;
    location: string;
    salary: string;
    status: 'open' | 'closed';
    employer_id: string;
    created_at?: string;
  };
  
  export type Application = {
    id?: string;
    job_id: string;
    worker_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at?: string;
  };