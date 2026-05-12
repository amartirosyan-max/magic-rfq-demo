import { Navigate, Outlet } from "react-router";
import { ELocalStorageKey } from "~/constants/localstorage";

export async function clientLoader() {
  const isUserLoggedIn =
    window.localStorage.getItem(ELocalStorageKey.IsUserLoggedIn) === "true";
  return { isUserLoggedIn };
}

interface IPrivateRouteProps {
  loaderData: {
    isUserLoggedIn: boolean;
  };
}

export default function PrivateRoute({ loaderData }: IPrivateRouteProps) {
  const { isUserLoggedIn } = loaderData;

  if (!isUserLoggedIn) {
    return <Navigate to={"/login"} />;
  }

  return <Outlet />;
}
