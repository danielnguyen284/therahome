import { OnboardingFlow } from '../../../components/onboarding/OnboardingFlow';

type PageProps = {
  params: Promise<{ step: string }>;
};

export default async function OnboardingStepPage({ params }: PageProps) {
  const { step } = await params;
  return <OnboardingFlow step={step} />;
}

