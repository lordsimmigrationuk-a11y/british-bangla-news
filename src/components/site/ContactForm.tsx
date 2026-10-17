"use client";

import { useActionState } from "react";
import { submitMessage, type FormState } from "@/app/(site)/actions";

const field = "mt-1 block w-full rounded border border-[#9ca3af] px-3 py-2 text-base focus:border-ink";

export function ContactForm({
  kind,
  articleUrl,
  showSubject = true,
}: {
  kind: "GENERAL" | "CORRECTION" | "ADVERTISING";
  articleUrl?: string;
  showSubject?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitMessage, { ok: false, message: "" });
  if (state.ok) {
    return (
      <p role="status" className="border-l-4 border-green-700 bg-green-50 p-4 text-base text-green-900">
        {state.message}
      </p>
    );
  }
  const err = (k: string) =>
    state.errors?.[k] ? (
      <p id={`${k}-err`} className="mt-1 text-sm text-brand-dark">
        {state.errors[k]}
      </p>
    ) : null;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="kind" value={kind} />
      <div className="hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.message && (
        <p role="alert" className="border-l-4 border-brand bg-red-50 p-3 text-base text-brand-dark">
          {state.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="font-semibold">
            আপনার নাম
          </label>
          <input
            id="cf-name"
            name="name"
            required
            autoComplete="name"
            className={field}
            aria-describedby={state.errors?.name ? "name-err" : undefined}
            aria-invalid={!!state.errors?.name}
          />
          {err("name")}
        </div>
        <div>
          <label htmlFor="cf-email" className="font-semibold">
            ইমেইল
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
            aria-describedby={state.errors?.email ? "email-err" : undefined}
            aria-invalid={!!state.errors?.email}
          />
          {err("email")}
        </div>
      </div>
      {kind === "CORRECTION" ? (
        <div>
          <label htmlFor="cf-article" className="font-semibold">
            প্রতিবেদনের লিংক
          </label>
          <input id="cf-article" name="articleUrl" type="url" defaultValue={articleUrl} className={field} />
        </div>
      ) : (
        showSubject && (
          <div>
            <label htmlFor="cf-subject" className="font-semibold">
              বিষয়
            </label>
            <input id="cf-subject" name="subject" className={field} />
          </div>
        )
      )}
      <div>
        <label htmlFor="cf-message" className="font-semibold">
          {kind === "CORRECTION" ? "কী ভুল আছে এবং সঠিক তথ্য কী (সম্ভব হলে সূত্রসহ)" : "বার্তা"}
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={6}
          required
          className={field}
          aria-describedby={state.errors?.message ? "message-err" : undefined}
          aria-invalid={!!state.errors?.message}
        />
        {err("message")}
      </div>
      <p className="text-sm text-muted">আপনার তথ্য শুধু এই বার্তার উত্তর দেওয়ার জন্য ব্যবহার করা হবে। বিস্তারিত গোপনীয়তা নীতিতে।</p>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-brand px-6 py-2.5 text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "পাঠানো হচ্ছে…" : "পাঠান"}
      </button>
    </form>
  );
}
