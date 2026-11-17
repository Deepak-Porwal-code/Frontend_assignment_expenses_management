import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Moneta` : 'Moneta — Your money, in focus';
  }, [title]);
}
