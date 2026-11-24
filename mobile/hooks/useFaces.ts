import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface FaceProfile {
  id: string;
  userId: string;
  name: string;
  r2Keys: string[];
  createdAt: string;
  updatedAt: string;
  viewUrls: string[];
  viewUrl: string; // Maintain backwards compatibility
}

interface FaceListResponse {
  faces: FaceProfile[];
}

interface UploadSlot {
  r2Key: string;
  uploadUrl: string;
}

interface UploadUrlResponse {
  id: string;
  name: string;
  slots: UploadSlot[];
}

interface ConfirmResponse {
  face: FaceProfile;
}

export function useFaces() {
  const queryClient = useQueryClient();

  // 1. Query to fetch the list of saved face profiles
  const facesQuery = useQuery<FaceProfile[], Error>({
    queryKey: ['faces'],
    queryFn: async () => {
      const response = await api.get<FaceListResponse>('/api/faces');
      return response.data.faces;
    },
    staleTime: 60 * 1000,
  });

  // 2. Mutation to register a new face profile with image upload pipeline
  const registerFaceMutation = useMutation<
    FaceProfile,
    Error,
    { name: string; localUris: string[]; onProgress?: (progress: number) => void }
  >({
    mutationFn: async ({ name, localUris, onProgress }) => {
      onProgress?.(0.1);
      
      // Step A: Request pre-signed R2 PUT URLs from backend
      const uploadUrlResponse = await api.post<UploadUrlResponse>('/api/faces/upload-url', {
        name,
        count: localUris.length,
      });
      const { id, slots } = uploadUrlResponse.data;

      onProgress?.(0.3);

      // Step B: Upload all image binaries to R2 in parallel
      const uploadPromises = slots.map(async (slot, index) => {
        const localUri = localUris[index];
        const fileResponse = await fetch(localUri);
        const blob = await fileResponse.blob();

        const r2UploadResponse = await fetch(slot.uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': 'image/jpeg',
          },
        });

        if (!r2UploadResponse.ok) {
          throw new Error(`Direct image upload to storage failed with status ${r2UploadResponse.status}`);
        }
      });

      await Promise.all(uploadPromises);
      onProgress?.(0.8);

      // Step C: Confirm successful upload with the backend to write DB record
      const confirmResponse = await api.post<ConfirmResponse>('/api/faces/confirm', {
        id,
        name,
        r2Keys: slots.map((s) => s.r2Key),
      });

      onProgress?.(1.0);
      return confirmResponse.data.face;
    },
    onSuccess: () => {
      // Invalidate cache to force list refresh
      queryClient.invalidateQueries({ queryKey: ['faces'] });
    },
  });

  // 3. Mutation to delete an existing face profile
  const deleteFaceMutation = useMutation<void, Error, string>({
    mutationFn: async (faceId) => {
      await api.delete(`/api/faces/${faceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faces'] });
    },
  });

  return {
    faces: facesQuery.data || [],
    isLoading: facesQuery.isLoading,
    error: facesQuery.error,
    refetch: facesQuery.refetch,
    registerFace: registerFaceMutation.mutateAsync,
    isRegistering: registerFaceMutation.isPending,
    registerError: registerFaceMutation.error,
    deleteFace: deleteFaceMutation.mutateAsync,
    isDeleting: deleteFaceMutation.isPending,
  };
}
