import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { HistoryResponse } from '../types/contract';

export function useHistory(page = 1, limit = 20) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery<HistoryResponse, Error>({
    queryKey: ['history', page, limit],
    queryFn: () => api.getHistory(page, limit),
    staleTime: 1000 * 30, // 30 seconds
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteHistoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  return {
    ...historyQuery,
    deleteItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    clearAll: clearMutation.mutateAsync,
    isClearing: clearMutation.isPending,
  };
}
