import { createContext, useContext, useEffect, useState } from "react";
import { Profile } from "@/types/database";
import { authClient } from "@/lib/auth";

type User = { id: string; email?: string; name?: string };
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
  createProfile: (data: any) => Promise<{ error: any }>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Helper to find the JWT in the session object
  const getSmartToken = (session: any) => {
    const potentialKeys = ['accessToken', 'access_token', 'idToken', 'id_token', 'jwt', 'token'];
    for (const key of potentialKeys) {
      const val = session?.[key];
      if (typeof val === 'string' && val.startsWith('ey')) {
        console.log(`getSmartToken: Found JWT in '${key}'`);
        return val;
      }
    }
    return session?.token || "";
  };
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
          remarks: data.remarks,
          profile_picture_url: data.profilePictureUrl,
          emergency_contact_name: data.emergencyContactName,
          emergency_contact_relationship: data.emergencyContactRelationship,
          emergency_contact_phone: data.emergencyContactPhone,
          emergency_contact_email: data.emergencyContactEmail,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          is_admin: data.isAdmin,
          is_instructor: data.isInstructor,
          karate_profile: data.karateProfile,
          rank_histories: data.rankHistories
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
        const { data, error } = await authClient.getSession();
        if (error) {
          console.error("checkSession error:", error);
        }
        if (data?.session) {
          const { user: authUser, session: authSession } = data;
          console.log("Auth Check - Session Keys:", Object.keys(authSession));
          console.log("Auth Check - Token Start:", authSession.token?.substring(0, 10));

          const mappedUser: User = { id: authUser.id, email: authUser.email, name: authUser.name };



          // Prioritize Opaque Token (authSession.token) over JWT for stability
          const validToken = authSession.token || "";

          setUser(mappedUser);
          setSession({ user: mappedUser, access_token: validToken });
          await fetchProfile(authUser.id, validToken);
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


        const smartToken = getSmartToken((data as any).session || { token: data.token });
        console.log("SignIn - SmartToken:", smartToken?.substring(0, 20));

        // Prefer the Opaque Token (session.token) for better compatibility with server-side DB checks
        // as JWT verification requires JWKS setup which might be missing/flaky.
        const token = smartToken || "";

        const mappedUser: User = { id: data.user.id, email: data.user.email, name: data.user.name };
        setUser(mappedUser);
        setSession({ user: mappedUser, access_token: token || "" });
        await fetchProfile(data.user.id, token || "");
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
        const smartToken = getSmartToken((data as any).session || { token: data.token });
        const token = smartToken || "";

        const mappedUser: User = { id: data.user.id, email: data.user.email, name: data.user.name };
        setUser(mappedUser);
        setSession({ user: mappedUser, access_token: token || "" });
        await fetchProfile(data.user.id, token || "");
      }
      return { error: null };
    } catch (error: any) {
      return { error: error.message || "Signup failed" };
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Error during server signout:", error);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const forgetPassword = async (email: string) => {
    try {
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

  const mapSnakeToCamel = (obj: any) => {
    const mapping: Record<string, string> = {
      first_name: 'firstName',
      last_name: 'lastName',
      date_of_birth: 'dateOfBirth',
      emergency_contact_name: 'emergencyContactName',
      emergency_contact_relationship: 'emergencyContactRelationship',
      emergency_contact_phone: 'emergencyContactPhone',
      emergency_contact_email: 'emergencyContactEmail',
      profile_picture_url: 'profilePictureUrl',
    };
    const mapped: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const mappedKey = mapping[key] || key;
      mapped[mappedKey] = value;
    }
    return mapped;
  };

  const mapCamelToSnake = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(mapCamelToSnake);
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        acc[snakeKey] = mapCamelToSnake(obj[key]);
        return acc;
      }, {} as any);
    }
    return obj;
  };

  const createProfile = async (profileData: any) => {
    if (!user || !session?.access_token) {
      console.warn("createProfile: Missing user or access token", { hasUser: !!user, hasToken: !!session?.access_token });
      return { error: "Not authenticated" };
    }
    console.log('createProfile: Using access token (first 20 chars):', session.access_token.substring(0, 20) + '...');
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(mapSnakeToCamel({
          user_id: user.id,
          ...profileData
        }))
      });

      if (!response.ok) {
        let errorMessage = "Failed to create profile";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If server returns HTML or plain text (e.g. 500 Edge error)
          errorMessage = `Server Error: ${response.status} ${response.statusText}`;
        }
        return { error: errorMessage };
      }

      await refreshProfile();
      return { error: null };
    } catch (error: any) {
      return { error: error.message || "An error occurred during profile creation" };
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: "Not authenticated" };
    try {
      // If updating userId (admin reassignment), we need to handle that mapping
      const { user_id, ...rest } = updates;
      const body = {
        userId: user_id || updates.userId || user.id,
        ...mapSnakeToCamel(rest)
      };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorMessage = "Failed to update profile";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server Error: ${response.status} ${response.statusText}`;
        }
        return { error: errorMessage };
      }

      await refreshProfile();
      return { error: null };
    } catch (error: any) {
      return { error: error.message || "An error occurred during profile update" };
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
    createProfile,
    updateProfile,
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
