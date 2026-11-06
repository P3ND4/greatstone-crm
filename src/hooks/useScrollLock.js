import { useEffect } from 'react';

let locks = 0;
/** Locks background scroll while a modal is open (ref-counted for stacked modals). */
export default function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    locks += 1;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbar ? `${scrollbar}px` : '';
    document.body.classList.add('scroll-locked');
    return () => {
      locks -= 1;
      if (locks === 0) {
        document.body.classList.remove('scroll-locked');
        document.body.style.paddingRight = '';
      }
    };
  }, [active]);
}
