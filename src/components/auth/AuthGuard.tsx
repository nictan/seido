import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        // Redirect to /auth but save the current location they were trying to go to
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Force profile completion if the user does not have an active profile
    // Allow access to /profile to actually complete it
    const { profile } = useAuth();
    if (user && !profile && location.pathname !== '/profile') {
        return <Navigate to="/profile" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

/**
 * FeatureGuard — wraps a route and redirects to / if the user's profile
 * doesn't have the required feature enabled.
 * Admins (`is_admin`) bypass the guard and always have access.
 */
export const FeatureGuard = ({
    feature,
    children,
}: {
    feature: 'grading' | 'referee_prep';
    children: React.ReactNode;
}) => {
    const { profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Admins always bypass feature gates
    if (profile?.is_admin) return <>{children}</>;

    // If features haven't loaded yet (undefined), treat as allowed to avoid
    // false redirects while the profile is still fetching.
    if (profile && profile.features !== undefined) {
        const enabled = profile.features?.[feature];
        // Only block if explicitly set to false — undefined means still loading
        if (enabled === false) {
            return <Navigate to="/?blocked=1" replace />;
        }
    }

    return <>{children}</>;
};
