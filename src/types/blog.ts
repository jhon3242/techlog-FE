export interface BlogPost {
  id: number;
  title: string;
  company?: string;
  summary?: string;
  imageUrl: string;
  tags?: string[];
  recommendations?: number;
  views?: number;
  brandColor?: string;
  content?: string;
  url?: string;
  blogType?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  successMessage: string;
  setSuccessMessage: (message: string) => void;
}

export interface PostersResponse {
  posters: BlogPost[];
  nextCursor: number | null;
  hasNext: boolean;
}

export interface PosterSearchRequest {
  keyword?: string;
  tags?: string[];
  blogType?: string;
  cursor?: number;
} 