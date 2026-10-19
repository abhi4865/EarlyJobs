// client/src/App.jsx
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-4">
      <Button>shadcn works</Button>
      <Button variant="outline">Tailwind works</Button>
    </div>
  );
}