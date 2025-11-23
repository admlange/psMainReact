import { createContext, useContext } from 'react';

export const AuthContext = createContext({ token: null, inspectionCompanyId: null, user: null });
export function useAuth(){ return useContext(AuthContext); }
