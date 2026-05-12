import { useParams } from "react-router";

export function useEffectiveSubsystemId() {
  const { id, systemId, "*": subsystemPath } = useParams();

  let effectiveSubsystemId = systemId;
  if (subsystemPath) {
    const subsysIds = subsystemPath
      // Split the subsystemPath by "/" to get all path segments
      .split("/")
      // Filter out every second segment (odd indices), which are assumed to be subsystem IDs
      .filter((_, index) => index % 2 === 1);
    if (subsysIds.length) {
      effectiveSubsystemId = subsysIds[subsysIds.length - 1];
    }
  }

  return { id, systemId, subsystemPath, effectiveSubsystemId };
}
