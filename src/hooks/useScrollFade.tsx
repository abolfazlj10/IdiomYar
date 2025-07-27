// hooks/useScrollFade.ts
import { useRef, useEffect, useCallback } from 'react';

interface ScrollFadeOptions {
  fadeTopClass?: string;
  fadeBottomClass?: string;
}

export const useScrollFade = (options?: ScrollFadeOptions) => {
  const { 
    fadeTopClass = 'fade-top', 
    fadeBottomClass = 'fade-bottom' 
  } = options || {};
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScrollState = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    const { scrollTop, scrollHeight, clientHeight } = node;
    const isScrolledToBottom = scrollHeight - (scrollTop + clientHeight) < 1;
    const hasOverflow = scrollHeight > clientHeight;

    node.classList.toggle(fadeTopClass, scrollTop > 10);
    node.classList.toggle(fadeBottomClass, hasOverflow && !isScrolledToBottom);

  }, [fadeTopClass, fadeBottomClass]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    // 1. به اسکرول دستی کاربر گوش می‌دهیم
    node.addEventListener('scroll', checkScrollState);

    // 2. آبزرور برای تغییرات محتوای داخلی (اضافه/کم شدن فرزندان)
    // این راه حل قطعی برای مشکل شماست
    const observer = new MutationObserver(checkScrollState);
    observer.observe(node, { childList: true, subtree: true });

    // 3. اجرای اولیه تابع برای بررسی وضعیت در اولین رندر
    // گاهی یک تأخیر بسیار کوتاه به مرورگر فرصت می‌دهد تا layout را کامل محاسبه کند
    const initialCheckTimeout = setTimeout(checkScrollState, 50);

    // Cleanup نهایی
    return () => {
      node.removeEventListener('scroll', checkScrollState);
      observer.disconnect(); // قطع کردن آبزرور
      clearTimeout(initialCheckTimeout);
    };
  }, [checkScrollState]);

  return scrollRef;
};