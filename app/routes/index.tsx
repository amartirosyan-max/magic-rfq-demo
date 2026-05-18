import { Navigate } from "react-router";

/**
 * Root entry for the demo dashboard screen.
 *
 * Users first see the old Magic UI shell (disabled create/upload +
 * two demo history rows) and can open either hardware route from there.
 */
export default function Home() {
  return <Navigate to="/dashboard" replace />;
}
