import { useMutation } from '@tanstack/react-query';
import { exportApi, saveBlob, type ExportRequest } from '../services/exportApi';
export function useExport() {
  return useMutation({
    mutationFn: (request: ExportRequest) => exportApi.download(request),
    onSuccess: ({ blob, filename }) => saveBlob(blob, filename),
  });
}
