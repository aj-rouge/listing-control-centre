import { STAGE_LABEL, STAGE_PILL } from "../lib/constants";
import { Stage } from "../lib/types";


export default function StagePill({
  stage, blockedReason,
}: { stage: Stage; blockedReason?: string | null }) {
  return (
    <span
      title={stage === 'blocked' ? blockedReason ?? '' : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STAGE_PILL[stage]}`}
    >
      ● {STAGE_LABEL[stage]}
    </span>
  );
}