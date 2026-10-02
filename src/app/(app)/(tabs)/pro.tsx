import { ComingInPhase, Header, Screen } from '../../../components/ui';
import { useAuth } from '../../../lib/auth';

export default function ProScreen() {
  const { profile } = useAuth();

  return (
    <Screen>
      <Header account kicker="Pro dashboard" title={profile?.fullName || 'Your business'} />
      <ComingInPhase
        phase={6}
        what="Schedule built from your customers' projections (with weather moves flagged), customer list, and an open-jobs feed filtered by service area and equipment fit."
      />
    </Screen>
  );
}
