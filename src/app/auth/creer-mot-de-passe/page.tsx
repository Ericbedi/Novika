import React, { Suspense } from "react";
import { SetPasswordClient } from "./set-password-client";

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3EFE6] flex items-center justify-center">Chargement...</div>}>
      <SetPasswordClient />
    </Suspense>
  );
}
