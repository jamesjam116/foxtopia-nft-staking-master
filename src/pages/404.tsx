import Link from "next/link";
import React from "react";

export default function NofoundPage() {
  return (
    <div className="no-found">
      <h1>404</h1>
      <p>This page could not be found.</p>
      <Link href="/staking">
        <a>Go To Staking</a>
      </Link>
    </div>
  );
}
