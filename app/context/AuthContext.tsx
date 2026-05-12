import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getAccountInfo } from "~/api/users";
import type { IUserResponse } from "~/api/users";

type User = { login: string };
type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  account: IUserResponse | null;
  accountLoading: boolean;
  accountError: Error | null;
  refetchAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  account: null,
  accountLoading: true,
  accountError: null,
  refetchAccount: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Один общий запрос на сессию — устраняет двойной вызов из-за Strict Mode
let accountPromise: Promise<IUserResponse> | null = null;

export const AuthProvider = ({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [account, setAccount] = useState<IUserResponse | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<Error | null>(null);

  const refetchAccount = useCallback(async () => {
    setAccountLoading(true);
    setAccountError(null);
    accountPromise = null;
    try {
      const data = await getAccountInfo();
      setAccount(data);
      setUser({ login: data.login });
    } catch (e) {
      setAccountError(e instanceof Error ? e : new Error(String(e)));
      setAccount(null);
    } finally {
      setAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!accountPromise) {
      accountPromise = getAccountInfo();
    }
    accountPromise
      .then((data) => {
        if (mounted) {
          setAccount(data);
          setUser({ login: data.login });
        }
      })
      .catch((e) => {
        if (mounted) {
          setAccountError(e instanceof Error ? e : new Error(String(e)));
          setAccount(null);
        }
      })
      .finally(() => {
        if (mounted) setAccountLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        account,
        accountLoading,
        accountError,
        refetchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
