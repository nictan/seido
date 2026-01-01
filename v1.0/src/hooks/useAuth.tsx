import { createContext, useContext, useEffect, useState } from "react";
import { Profile } from "@/types/database";
import { authClient } from "@/lib/auth";

type User = { id: string; email?: string };
type Session = { user: User; access_token: string };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forgetPassword: (email: string) => Promise<{ error: any }>;
  resetPassword: (newPassword: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, token?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/profile?userId=${userId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        const mappedProfile: Profile = {
          id: data.id,
          user_id: data.userId,
          first_name: data.firstName,
          last_name: data.lastName,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          email: data.email,
          mobile: data.mobile,
          dojo: data.dojo,
          remarks: data.remarks,
          profile_picture_url: data.profilePictureUrl,
          is_student: data.isStudent,
          is_instructor: data.isInstructor,
          is_admin: data.isAdmin,
          current_rank_id: data.currentRankId,
          rank_effective_date: data.rankEffectiveDate,
          current_grade: data.currentGrade,
          created_at: data.createdAt,
          updated_at: data.updatedAt
        };
        setProfile(mappedProfile);
      } else {
        console.error("Failed to fetch profile");
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await authClient.getSession();
        if (data?.session) {
          const { user: authUser, session: authSession } = data;
          const mappedUser: User = { id: authUser.id, email: authUser.email };
          setUser(mappedUser);
          setSession({ user: mappedUser, access_token: authSession.token || "neon-token" });
          await fetchProfile(authUser.id, authSession.token);
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error) return { error: error.message || "Login failed" };

      if (data && data.user) {
        const mappedUser: User = { id: data.user.id, email: data.user.email };
        setUser(mappedUser);
        setSession({ user: mappedUser, access_token: data.token });
        await fetchProfile(data.user.id, data.token);
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.message || "Login failed" };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: `${userData.firstName} ${userData.lastName}`
      });

      if (error) return { error: error.message || "Signup failed" };

      if (data && data.user) {
        try {
          await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify({
              userId: data.user.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: data.user.email
            })
          });
        } catch (profileError) {
          console.error("Failed to create profile record", profileError);
        }

        const mappedUser: User = { id: data.user.id, email: data.user.email };
        setUser(mappedUser);
        setSession({ user: mappedUser, access_token: data.token || "" });
        await fetchProfile(data.user.id, data.token || undefined);
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.message || "Signup failed" };
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    window.location.reload();
  };

  const forgetPassword = async (email: string) => {
    try {
      // The endpoint /request-password-reset returned 200 in discovery.
      // Trying the requestPasswordReset method directly.
      const { error } = await (authClient as any).requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`
      });
      return { error: error?.message || null };
    } catch (error: any) {
      return { error: error.message || "Failed to send reset email" };
    }
  };

  const resetPassword = async (newPassword: string) => {
    try {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        return { error: "Reset token is missing from the URL. Please request a new reset link." };
      }

      const { error } = await (authClient as any).resetPassword({
        newPassword,
        token
      });
      return { error: error?.message || null };
    } catch (error: any) {
      return { error: error.message || "Reset password failed" };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, session?.access_token);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    forgetPassword,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
