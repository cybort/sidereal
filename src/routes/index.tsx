import { createFileRoute } from "@tanstack/react-router";
import { StarfieldApp } from "@/components/StarfieldApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <StarfieldApp />;
}
