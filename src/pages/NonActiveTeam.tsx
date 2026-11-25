import { useState } from 'react';
import TeamExplorer from '../components/TeamExplorer';
import { api } from '../api';

export default function NonActiveTeam() {
  const [days, setDays] = useState(30);
  return (
    <TeamExplorer
      subtitle={`Team members with no paid or delivered order in the last ${days} days.`}
      fetcher={async (q) => {
        const d = await api.teamNonActive(q);
        setDays(d.windowDays);
        return d;
      }}
      statusFilter={false}
      emptyText="Everyone on your team has been active recently. 🎉"
    />
  );
}
