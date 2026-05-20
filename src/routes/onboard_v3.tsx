import { createFileRoute } from "@tanstack/react-router";
import WeightLossFunnel from "@/components/funnel/WeightLossFunnel";

export const Route = createFileRoute("/onboard_v3")({
  component: OnboardPage,
});

function OnboardPage() {
  return <WeightLossFunnel />;
}
