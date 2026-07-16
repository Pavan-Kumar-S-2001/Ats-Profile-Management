type ToastType = 'success' | 'error' | 'info';

function show(message: string, type: ToastType) {
  const el = document.createElement('div');
  const colors: Record<ToastType, string> = {
    success: '#16a34a',
    error: '#dc2626',
    info: '#4f46e5',
  };
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: colors[type],
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    zIndex: '9999',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  } as CSSStyleDeclaration);
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 200);
  }, 3200);
}

const toast = {
  success: (msg: string) => show(msg, 'success'),
  error: (msg: string) => show(msg, 'error'),
  info: (msg: string) => show(msg, 'info'),
};

export default toast;
