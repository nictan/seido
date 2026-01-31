import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, ArrowRight, GraduationCap, ClipboardList } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import seidoLogo from "@/assets/seido-logo.png";

export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <img src={seidoLogo} alt="Seido" className="h-8 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">SEIDO</h1>
              <p className="text-sm text-muted-foreground">Hayashi-Ha Shitoryu Singapore</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/referee"
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors flex items-center gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              Referee Prep
            </Link>
            <Link
              to="/grading"
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors flex items-center gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              Grading
            </Link>
          </nav>
        </div>

        {(user || profile) ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4" />
              {profile ? (
                <>
                  <span className="font-medium">
                    {profile.first_name} {profile.last_name}
                  </span>
                  {profile.is_instructor && (
                    <button
                      onClick={() => navigate("/instructor")}
                      className="grade-badge bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      Instructor
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                  {profile.is_admin && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="grade-badge bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      Admin
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                  {profile.is_admin && (
                    <Link
                      to="/admin/ranks"
                      className="ml-2 px-2 py-0.5 text-xs border border-muted-foreground rounded-full hover:bg-accent transition-colors"
                      title="Manage Ranks"
                    >
                      Ranks
                    </Link>
                  )}
                </>
              ) : (
                <span className="font-medium text-muted-foreground">
                  {user?.email || "User"}
                </span>
              )}
            </div>
            {user && (
              <>
                <Link to="/profile" className="text-sm font-medium transition-colors hover:text-primary">
                  Profile
                </Link>
                <Link to="/grading" className="text-sm font-medium transition-colors hover:text-primary">
                  Grading
                </Link>
                {profile?.is_instructor && (
                  <Link to="/instructor" className="text-sm font-medium transition-colors hover:text-primary text-blue-600">
                    Instructor
                  </Link>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/referee"
              className="md:hidden px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              Referee Prep
            </Link>
            <Button size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}