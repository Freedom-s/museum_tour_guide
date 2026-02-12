import { create } from 'zustand';
import type { UploadedFile } from '@/types/upload';

interface UploadState {
  artifactName: string;
  docFile: File | null;
  docContent: string | null;
  images: UploadedFile[];
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;

  // Actions
  setArtifactName: (name: string) => void;
  setDocFile: (file: File | null) => void;
  setDocContent: (content: string | null) => void;
  addImage: (file: File, base64: string) => void;
  removeImage: (uid: string) => void;
  setUploadProgress: (progress: number) => void;
  setUploading: (uploading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const generateFileUid = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useUploadStore = create<UploadState>((set) => ({
  artifactName: '',
  docFile: null,
  docContent: null,
  images: [],
  uploadProgress: 0,
  isUploading: false,
  error: null,

  setArtifactName: (name) => {
    set({ artifactName: name });
  },

  setDocFile: (file) => {
    set({ docFile: file, docContent: null });
  },

  setDocContent: (content) => {
    set({ docContent: content });
  },

  addImage: (file, base64) => {
    const newFile: UploadedFile = {
      uid: generateFileUid(),
      name: file.name,
      status: 'done',
      url: base64,
      originFileObj: file,
      base64,
    };

    set((state) => ({
      images: [...state.images, newFile],
    }));
  },

  removeImage: (uid) => {
    set((state) => ({
      images: state.images.filter((img) => img.uid !== uid),
    }));
  },

  setUploadProgress: (progress) => {
    set({ uploadProgress: progress });
  },

  setUploading: (uploading) => {
    set({ isUploading: uploading });
  },

  setError: (error) => {
    set({ error });
  },

  reset: () => {
    set({
      artifactName: '',
      docFile: null,
      docContent: null,
      images: [],
      uploadProgress: 0,
      isUploading: false,
      error: null,
    });
  },
}));
