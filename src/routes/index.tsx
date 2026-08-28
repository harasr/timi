import { createFileRoute } from "@tanstack/react-router";
import { Skybound } from "@/components/skybound/Skybound";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Skybound />;
}
