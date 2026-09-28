"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

/** "join the pack" signup with a paw-stamp success state. */
export default function Newsletter() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "error") inputRef.current?.focus();
  }, [status]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = inputRef.current?.value ?? "";
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong, please try again.");
        setStatus("error");
        return;
      }
      setMessage(data.message);
      setStatus("done");
    } catch {
      setError("Network hiccup, please try again.");
      setStatus("error");
    }
  };

  return (
    <section className="newsletter" aria-labelledby="newsletter-title">
      <img
        src="/assets/Footer-Sticker SVG/footer-sticker-100.svg"
        alt=""
        aria-hidden="true"
        className="newsletter__sticker"
      />
      <h2 id="newsletter-title" className="story-title story-title--section">
        treats in your <em>inbox</em>
      </h2>
      <p className="newsletter__lede">
        New toys, Biscuit test results and the occasional dog photo. Get 10% off your first box.
      </p>
      {status === "done" ? (
        <p className="newsletter__done" role="status">
          <svg className="paw-stamp" viewBox="0 0 120 120" aria-hidden="true">
            <circle className="paw-stamp__ring" cx="60" cy="60" r="54" />
            <g className="paw-stamp__paw">
              <ellipse cx="60" cy="72" rx="19" ry="16" />
              <ellipse cx="36" cy="50" rx="8" ry="10" />
              <ellipse cx="51" cy="37" rx="8" ry="10.5" />
              <ellipse cx="69" cy="37" rx="8" ry="10.5" />
              <ellipse cx="84" cy="50" rx="8" ry="10" />
            </g>
          </svg>
          {message}
        </p>
      ) : (
        <form className="newsletter__form" onSubmit={onSubmit} noValidate>
          <label htmlFor="newsletter-email" className="visually-hidden">
            Email address
          </label>
          <input
            ref={inputRef}
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="your email"
            aria-invalid={status === "error" || undefined}
            aria-describedby={status === "error" ? "newsletter-error" : undefined}
          />
          <button type="submit" disabled={status === "sending"}>
            {status === "sending" ? "signing up…" : "sign me up"}
          </button>
          {status === "error" && (
            <p className="newsletter__error" id="newsletter-error">
              {error}
            </p>
          )}
        </form>
      )}
      <p className="newsletter__fine">Demo store: nothing is actually sent, and there&apos;s no real discount.</p>
    </section>
  );
}
