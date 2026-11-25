import TeamExplorer from '../components/TeamExplorer';
import { api } from '../api';

export default function MyDirect() {
  return (
    <TeamExplorer
      subtitle="Members you personally sponsored."
      fetcher={api.teamDirect}
      showLevel={false}
      showSponsor={false}
      emptyText="Share your invite link from the dashboard to add your first direct member."
    />
  );
}
