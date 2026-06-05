// apps/web/features/scanner/hooks/useOcrScan.ts
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase/client';
import { OcrAnalysisResponse } from '@/shared/lib/zod-schemas/scanner';

export const useOcrScan = () => {
  return useMutation({
    mutationFn: async (imageBase64: string): Promise<OcrAnalysisResponse> => {
      const { data, error } = await supabase.functions.invoke('ocr-analyze', {
        body: { image_base64: imageBase64 },
      });

      if (error) throw new Error(error.message);
      return data;
    },
  });
};