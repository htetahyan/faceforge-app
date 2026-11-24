import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconEmoji: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface CategoriesResponse {
  categories: TemplateCategory[];
}

export function useCategories() {
  return useQuery<TemplateCategory[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<CategoriesResponse>('/api/categories');
      return response.data.categories;
    },
    staleTime: 5 * 60 * 1000,
  });
}
