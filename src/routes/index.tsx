import { createFileRoute } from "@tanstack/react-router";
import WeightLossFunnel from "@/components/funnel/WeightLossFunnel";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <WeightLossFunnel />;
}
