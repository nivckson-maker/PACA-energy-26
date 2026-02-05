export interface Service {
  id: string;
  title: string;
  icon: string;
  description: string;
  details?: string;
}

export interface Project {
  id: string;
  title: string;
  client: string;
  location: string;
  category: string;
  year: string;
  description: string;
  status?: string;
}

export interface Inquiry {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
  type: string;
  createdAt?: any;
}

export interface AdminStats {
  projects: number;
  services: number;
  inquiries: number;
}
