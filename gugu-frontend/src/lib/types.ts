
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export enum UserRole {
    Employer = 'employer',
    Worker = 'worker'
  };
  
  export type JobPost = {
    id: string;
    title: string;
    description: string;
    location: string;
    salary: string;
    status: 'open' | 'closed';
    employer_id: string;
    created_at?: string;
    updated_at?: string;
    application_count?: number; 
    employer?: {
      id: string;
      company_name: string;
      address: string;
    };
    applications?: Application[];
    hasApplied?: boolean;
    [key: string]: any;
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
      full_name: string;
      email: string;
      role: string;
      skills: string[];
      hourly_rate: number;
    };
  };

  export interface Testimonial {
    id: string;
    content: string;
    role: UserRole;
    created_at: string;
    profiles: {
      full_name: string;
      photo_url?: string;
      role: UserRole; 
    };
  }

  // Message types for chat functionality
  export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read: boolean;
    sender?: {
      id: string;
      full_name: string;
      photo_url?: string;
      role: UserRole;
    };
  }

  export interface Conversation {
    id: string;
    created_at: string;
    updated_at: string;
    application_id?: string;
    employer_id: string;
    worker_id: string;
    last_message?: string;
    last_message_sender_id?: string;
    unread_count?: number;
    employer?: {
      id: string;
      full_name: string;
      company_name: string;
      photo_url?: string;
      username?: string;
      last_active?: string;
    };
    worker?: {
      id: string;
      full_name: string;
      photo_url?: string;
      username?: string;
      last_active?: string;
    };
    application?: {
      id: string;
      job_id: string;
      status: ApplicationStatus;
      job?: {
        id: string;
        title: string;
      };
    };
  }

  // Notification types
  export type NotificationType = 'message' | 'application' | 'job_match' | 'system';

  export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    related_id?: string;
    created_at: string;
    read: boolean;
    data?: Record<string, any>;
  }