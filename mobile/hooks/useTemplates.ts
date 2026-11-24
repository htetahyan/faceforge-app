import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface Template {
  id: string;
  title: string;
  promptTemplate: string;
  thumbnailUrl: string;
  description: string | null;
  faceSlots: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface TemplatesResponse {
  templates: Template[];
  pagination?: PaginationMeta;
}

interface TemplateResponse {
  template: Template;
}

/**
 * Hook to retrieve active templates from the backend with pagination/filtering support
 */
export function useTemplates(params?: { limit?: number; offset?: number; categoryId?: string; popular?: boolean }) {
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;
  const categoryId = params?.categoryId;
  const popular = params?.popular;

  return useQuery<Template[], Error>({
    queryKey: ['templates', limit, offset, categoryId, popular],
    queryFn: async () => {
      const response = await api.get<TemplatesResponse>('/api/templates', {
        params: { limit, offset, categoryId, popular },
      });
      return response.data.templates;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to retrieve templates along with pagination metadata (total, hasMore, offset)
 */
export function useTemplatesPaginated(params?: { limit?: number; offset?: number; categoryId?: string; popular?: boolean }) {
  const limit = params?.limit || 20;
  const offset = params?.offset || 0;
  const categoryId = params?.categoryId;
  const popular = params?.popular;

  return useQuery<TemplatesResponse, Error>({
    queryKey: ['templatesPaginated', limit, offset, categoryId, popular],
    queryFn: async () => {
      const response = await api.get<TemplatesResponse>('/api/templates', {
        params: { limit, offset, categoryId, popular },
      });
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to retrieve a single template's detailed specifications by its UUID
 */
export function useTemplate(id: string | undefined) {
  return useQuery<Template, Error>({
    queryKey: ['template', id],
    queryFn: async () => {
      if (!id) throw new Error('Template ID is required');
      const response = await api.get<TemplateResponse>(`/api/templates/${id}`);
      return response.data.template;
    },
    enabled: !!id,
  });
}
