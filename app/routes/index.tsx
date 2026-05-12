import { Navigate } from "react-router";
import { ELocalStorageKey } from "~/constants/localstorage";

export default function Home() {
  const isUserLoggedIn =
    window.localStorage.getItem(ELocalStorageKey.IsUserLoggedIn) === "true";

  if (isUserLoggedIn) {
    return <Navigate to="/dashboard" />;
  }

  return <Navigate to="/login" />;
}
