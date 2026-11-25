import { api } from '../api';
import LevelOverview from '../components/LevelOverview';
import TeamExplorer from '../components/TeamExplorer';

export default function LevelTeam() {
  return (
    <TeamExplorer
      subtitle="Your whole team, grouped by how many levels below you they sit."
      fetcher={api.teamLevels}
      overview={({ summary }) => <LevelOverview summary={summary} />}
      levelFilter
      onExport={api.exportLevelTeam}
      emptyText="Your team will appear here as members join under you."
    />
  );
}
