import { useCallback } from 'react';
import { toast } from 'react-toastify';

export const useToast = () => {
  const showSuccess = useCallback((message) => {
    toast.success(message);
  }, []);

  const showError = useCallback((message) => {
    toast.error(message);
  }, []);

  const showInfo = useCallback((message) => {
    toast.info(message);
  }, []);

  return {
    showSuccess,
    showError,
    showInfo
  };
};