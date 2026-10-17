import { PlaneTakeoff } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <PlaneTakeoff className="size-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-normal text-secondary">
        AR Jet
      </span>
    </div>
  );
}
