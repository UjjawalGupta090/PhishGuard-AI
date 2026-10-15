import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { AnalyzeRequest, AnalyzeResponse } from '../types/contract';

export function useAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<AnalyzeResponse, Error, AnalyzeRequest>({
    mutationFn: (payload: AnalyzeRequest) => api.analyze(payload),
    onSuccess: () => {
      // Refresh history list automatically upon successful analysis
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
