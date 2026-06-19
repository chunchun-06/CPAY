import { useMemo } from 'react';
import toast from 'react-hot-toast';

export default function useToast() {
  return useMemo(() => ({
    success: (msg) =>
      toast.success(msg, {
        style: {
          background: '#0d1526',
          color: '#34d399',
          border: '1px solid #10b981',
        },
        iconTheme: { primary: '#10b981', secondary: '#0d1526' },
      }),
    error: (msg) =>
      toast.error(msg, {
        style: {
          background: '#0d1526',
          color: '#fb7185',
          border: '1px solid #f43f5e',
        },
        iconTheme: { primary: '#f43f5e', secondary: '#0d1526' },
      }),
    loading: (msg) =>
      toast.loading(msg, {
        style: {
          background: '#0d1526',
          color: '#94a3b8',
          border: '1px solid #334155',
        },
      }),
    dismiss: toast.dismiss,
  }), []);
}
