export function ToastContainer({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}

function Toast({ toast }) {
  const styles = {
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-500 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-stone-700 text-white',
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto animate-fade-in ${styles[toast.type] ?? styles.info}`}
    >
      {toast.message}
    </div>
  );
}
