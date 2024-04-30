import { createContext, useState, useContext, ReactNode } from 'react';

// Define the type for the context value
interface SessionContextType {
    isNewSession: boolean;
    setNewSession: (isNew: boolean) => void;
}

// Create the context with a default value
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Create a provider component
export const SessionProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [isNewSession, setNewSession] = useState<boolean>(false);

    return (
        <SessionContext.Provider value={{ isNewSession, setNewSession }}>
            {children}
        </SessionContext.Provider>
    );
};

// Custom hook to use the context
export const useSession = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
