// src/components/VerifiedBadge.jsx
// Small reusable "Verified Employer" badge.
// Shows only when `verified === true` OR `status === 'passed verification'`.

import React from "react";

export default function VerifiedBadge({ verified, status }) {
  const isVerified =
    Boolean(verified) || String(status).toLowerCase() === "passed verification";

  if (!isVerified) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "2px 8px",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        background: "#E6F5F1",
        color: "#0B6B53", // pine green
        border: "1px solid #bfe7db",
      }}
      aria-label="Verified employer"
      title="Verified employer"
    >
      {/* inline check-circle icon (no extra libs) */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
          stroke="#0B6B53"
          strokeWidth="1.5"
        />
        <path
          d="m8.5 12.5 2.5 2.5 4.5-5"
          stroke="#0B6B53"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Verified
    </span>
  );
}
