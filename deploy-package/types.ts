export interface Project {
  id: number;
  name: string;
  date: string;
  image: string;
  prompt: string;
  images?: { src: string; prompt: string }[];
}

export type ViewState = 'dashboard' | 'projects' | 'project-detail' | 'generator' | 'editor' | 'library';

// Generator Types
export interface GenStyle {
  id: string;
  name: string;
  preview: string; // URL for preview image
  description: string;
  prompt?: string;
}

export interface GenSubtype {
  id: string;
  name: string;
  icon: string;
  styles: GenStyle[];
}

export interface GenCategory {
  id: string;
  name: string;
  subtypes: GenSubtype[];
}