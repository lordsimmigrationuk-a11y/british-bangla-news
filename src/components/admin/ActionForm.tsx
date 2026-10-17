"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";

export type ActionState = { error: string | null; notice?: string | null };
type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

const PendingCtx = createContext(false);

/**
 * Submits a server action without React's automatic form reset, so an editor never
 * loses typed text when validation fails. The clicked button's name/value is included.
 */
export function ActionForm({
  action,
  children,
  className,
  confirm,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error) alertRef.current?.focus();
  }, [state]);
  return (
    <form
      className={className}
      encType="multipart/form-data"
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const msg = submitter?.dataset.confirm ?? confirm;
        if (msg && !window.confirm(msg)) return;
        const fd = new FormData(e.currentTarget, submitter);
        startTransition(() => formAction(fd));
      }}
    >
      {state.error && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="mb-4 border-l-4 border-brand bg-red-50 px-4 py-3 text-base text-brand-dark"
        >
          {state.error}
        </div>
      )}
      {state.notice && (
        <div role="status" className="mb-4 border-l-4 border-green-700 bg-green-50 px-4 py-3 text-base text-green-900">
          {state.notice}
        </div>
      )}
      <PendingCtx.Provider value={pending}>{children}</PendingCtx.Provider>
    </form>
  );
}

export function SubmitButton({
  children,
  name,
  value,
  variant = "primary",
  confirm,
  className = "",
}: {
  children: React.ReactNode;
  name?: string;
  value?: string;
  variant?: "primary" | "secondary" | "danger" | "dark";
  confirm?: string;
  className?: string;
}) {
  const pending = useContext(PendingCtx);
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    dark: "bg-ink text-white hover:bg-black",
    secondary: "border border-[#9ca3af] bg-white text-ink hover:border-ink",
    danger: "border border-brand bg-white text-brand-dark hover:bg-red-50",
  }[variant];
  return (
    <button
      type="submit"
      name={name}
      value={value}
      data-confirm={confirm}
      disabled={pending}
      className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-semibold disabled:opacity-60 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
