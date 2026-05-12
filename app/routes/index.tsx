import { Navigate } from "react-router";

/**
 * Root entry. For the hardware-configurator demo we always land on /avaya.
 * Login / dashboard routes remain reachable directly (e.g. /login) so the
 * existing app keeps working for development.
 */
export default function Home() {
  return <Navigate to="/avaya" replace />;
}
