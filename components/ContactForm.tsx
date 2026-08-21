"use client";

import { useState } from "react";
import s from "./ContactForm.module.css";

const TO = "md@nadzhealthcare.com";

type Fields = { email: string; phone: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

const validate = (f: Fields): Errors => {
  const e: Errors = {};
  if (!f.email.trim()) e.email = "An email address is needed to reply.";
  // deliberately loose: the only thing worth rejecting here is an address that
  // plainly cannot be one, and stricter patterns turn away valid addresses
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    e.email = "That does not look like an email address.";
  if (!f.message.trim()) e.message = "Please add a message.";
  return e;
};

export default function ContactForm() {
  const [f, setF] = useState<Fields>({ email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const set = (k: keyof Fields) => (v: string) => {
    setF((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate(f);
    setErrors(found);
    if (Object.keys(found).length) return;

    /*
     * There is no server behind this yet, so the message is handed to the
     * visitor's own mail client. That works everywhere without a key or an
     * endpoint; swapping in a real sender means replacing this one block.
     */
    const body = [
      f.message.trim(),
      "",
      `From: ${f.email.trim()}`,
      f.phone.trim() ? `Phone: ${f.phone.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href =
      `mailto:${TO}` +
      `?subject=${encodeURIComponent("Enquiry from nadzhealthcare.com")}` +
      `&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form className={s.form} onSubmit={submit} noValidate>
      <p className={`micro ${s.legend}`}>Send a message</p>

      <div className={s.row}>
        <label className={s.field}>
          <span className="micro">Email</span>
          <input
            type="email"
            name="email"
            value={f.email}
            onChange={(e) => set("email")(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "err-email" : undefined}
            data-cursor="link"
          />
          {errors.email && (
            <span className={s.err} id="err-email" role="alert">
              {errors.email}
            </span>
          )}
        </label>

        <label className={s.field}>
          <span className="micro">Phone (optional)</span>
          <input
            type="tel"
            name="phone"
            value={f.phone}
            onChange={(e) => set("phone")(e.target.value)}
            placeholder="+971"
            autoComplete="tel"
            data-cursor="link"
          />
        </label>
      </div>

      <label className={s.field}>
        <span className="micro">Message</span>
        <textarea
          name="message"
          rows={4}
          value={f.message}
          onChange={(e) => set("message")(e.target.value)}
          placeholder="How can we help?"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "err-message" : undefined}
          data-cursor="link"
        />
        {errors.message && (
          <span className={s.err} id="err-message" role="alert">
            {errors.message}
          </span>
        )}
      </label>

      <div className={s.foot}>
        <button type="submit" className={s.send} data-cursor="link">
          Send message
        </button>
        <p className={`micro ${s.note}`} role="status">
          {sent
            ? "Your mail app should be open with the message ready to send."
            : `Opens your mail app, addressed to ${TO}`}
        </p>
      </div>
    </form>
  );
}
