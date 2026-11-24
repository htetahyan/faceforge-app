import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface GenerationTask {
  id: string;
  userId: string;
  templateId?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  faceMappings: Record<string, string>;
  outputUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  template?: {
    title: string;
    thumbnailUrl: string;
  };
}

export interface TriggerGenerationParams {
  templateId?: string;
  faceMappings: Record<string, string>;
  customPrompt?: string;
}

export interface TriggerGenerationResponse {
  taskId: string;
  status: 'pending' | 'processing';
  queuePosition?: number;
  message: string;
}

interface TaskListResponse {
  tasks: GenerationTask[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function useGeneration(params?: { limit?: number; offset?: number }) {
  const limit = params?.limit || 20;
  const offset = params?.offset || 0;
  const queryClient = useQueryClient();

  const historyQuery = useQuery<TaskListResponse, Error>({
    queryKey: ['generationHistory', limit, offset],
    queryFn: async () => {
      const response = await api.get<TaskListResponse>('/api/generate', {
        params: { limit, offset },
      });
      return response.data;
    },
  });

  const triggerGenerationMutation = useMutation<TriggerGenerationResponse, Error, TriggerGenerationParams>({
    mutationFn: async ({ templateId, faceMappings, customPrompt }) => {
      const response = await api.post<TriggerGenerationResponse>('/api/generate', {
        templateId,
        faceMappings,
        customPrompt,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generationHistory'] });
    },
  });

  const triggerBatchGeneration = async (
    items: TriggerGenerationParams[],
    onTaskAdded?: (taskIds: string[]) => void
  ): Promise<string[]> => {
    const taskIds: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const res = await triggerGenerationMutation.mutateAsync(item);
        taskIds.push(res.taskId);
        if (onTaskAdded) {
          onTaskAdded([...taskIds]);
        }
        // One-finish-after-one: await completion of current slide task before submitting next slide
        if (items.length > 1 && i < items.length - 1) {
          let finished = false;
          while (!finished) {
            await new Promise((r) => setTimeout(r, 1500));
            try {
              const statusRes = await api.get<{ status: string }>(`/api/generate/tasks/${res.taskId}/status`);
              const st = statusRes.data?.status;
              if (st === 'completed' || st === 'failed') {
                finished = true;
              }
            } catch (pollErr) {
              console.warn('[Sequential slide poll check error]', pollErr);
            }
          }
        }
      } catch (err: any) {
        if (taskIds.length === 0 || err?.response?.status === 402 || err?.response?.data?.code === 'LIMIT_EXCEEDED') {
          throw err;
        }
        console.warn('[triggerBatchGeneration] Slide error:', err?.message || err);
      }
    }
    return taskIds;
  };

  return {
    history: historyQuery.data?.tasks || [],
    pagination: historyQuery.data?.pagination,
    isHistoryLoading: historyQuery.isLoading,
    historyError: historyQuery.error,
    refetchHistory: historyQuery.refetch,
    triggerGeneration: triggerGenerationMutation.mutateAsync,
    triggerBatchGeneration,
    isTriggering: triggerGenerationMutation.isPending,
    triggerError: triggerGenerationMutation.error,
  };
}

export function useTaskStatus(taskId: string | undefined) {
  return useQuery<GenerationTask, Error>({
    queryKey: ['taskStatus', taskId],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required');
      const response = await api.get<GenerationTask>(`/api/generate/tasks/${taskId}/status`);
      return response.data;
    },
    enabled: !!taskId,
    refetchInterval: (query) => {
      const task = query.state.data;
      if (task && (task.status === 'pending' || task.status === 'processing')) {
        return 1500;
      }
      return false;
    },
    refetchIntervalInBackground: true,
  });
}

export function useBatchTaskStatus(taskIds: string[]) {
  const taskKey = taskIds ? taskIds.join(',') : '';
  return useQuery<GenerationTask[], Error>({
    queryKey: ['batchTaskStatus', taskKey],
    queryFn: async () => {
      if (!taskIds || taskIds.length === 0) return [];
      const responses = await Promise.all(
        taskIds.map((id) => api.get<GenerationTask>(`/api/generate/tasks/${id}/status`))
      );
      return responses.map((r) => r.data);
    },
    enabled: taskIds.length > 0,
    refetchInterval: (query) => {
      const tasks = query.state.data;
      if (!tasks) return 1500;
      const isAnyPending = tasks.some(
        (t) => t.status === 'pending' || t.status === 'processing'
      );
      return isAnyPending ? 1500 : false;
    },
    refetchIntervalInBackground: true,
  });
}
