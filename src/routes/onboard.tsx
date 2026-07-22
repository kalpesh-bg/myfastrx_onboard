import { createFileRoute } from "@tanstack/react-router";
import WeightLossFunnel from "@/components/funnel/WeightLossFunnel";

export const Route = createFileRoute("/onboard")({
  component: OnboardPage,
});

function OnboardPage() {
  return <WeightLossFunnel />;
}
