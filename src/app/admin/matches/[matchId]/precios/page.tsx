import MatchPreciosClient from "./MatchPreciosClient";

export default async function AdminMatchPreciosPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <MatchPreciosClient matchId={matchId} />;
}
