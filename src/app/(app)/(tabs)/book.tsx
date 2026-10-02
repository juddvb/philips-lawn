import { ComingInPhase, Header, Screen } from '../../../components/ui';

export default function BookScreen() {
  return (
    <Screen>
      <Header account kicker="Services" title="Book a pro" body="Pick services and a schedule, compare bids from local pros, and book them for your projected mow date." />
      <ComingInPhase
        phase={5}
        what="Mowing, aeration & overseeding, leaf cleanup, fertilize & weed control, dethatching. Bids, pro profiles, reviews and payment."
      />
    </Screen>
  );
}
