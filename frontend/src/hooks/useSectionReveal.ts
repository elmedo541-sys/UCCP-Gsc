import { useEffect, type RefObject } from 'react';

export default function useSectionReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!root || preference.matches || !('IntersectionObserver' in window)) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    elements.forEach(element => { element.classList.add('reveal-ready'); observer.observe(element); });
    const showAll = () => { if (preference.matches) { observer.disconnect(); elements.forEach(element => element.classList.remove('reveal-ready')); } };
    preference.addEventListener('change', showAll);
    return () => { observer.disconnect(); preference.removeEventListener('change', showAll); elements.forEach(element => element.classList.remove('reveal-ready')); };
  }, [ref]);
}
