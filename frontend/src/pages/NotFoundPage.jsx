// src/pages/NotFoundPage.jsx
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/common/States";

export default function NotFoundPage() {
  return (
    <EmptyState icon={Compass} title="Page not found" description="The page you're looking for doesn't exist or was moved."
      action={<Link to="/" className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">Back to dashboard</Link>} />
  );
}
