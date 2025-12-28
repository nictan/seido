import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpDown, ArrowLeft } from "lucide-react";

type Rank = {
  id: string;
  rank_order: number;
  kyu: number | null;
  dan: number | null;
  belt_color: string;
  stripes: number;
  display_name: string;
};

type GradingConfig = {
  id: string;
  rank_id: string;
  is_available: boolean;
  display_order: number;
  rank: Rank;
};

type UserProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_instructor: boolean;
  is_admin: boolean;
  dojo: string;
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gradingConfigs, setGradingConfigs] = useState<GradingConfig[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Redirect if not admin
  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchGradingConfigurations();
    fetchUsers();
  }, []);

  const fetchGradingConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from("grading_configurations")
        .select(`
          *,
          rank:ranks(*)
        `)
        .order("display_order");

      if (error) throw error;
      setGradingConfigs(data || []);
    } catch (error) {
      console.error("Error fetching grading configurations:", error);
      toast({
        title: "Error",
        description: "Failed to load grading configurations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, email, is_instructor, is_admin, dojo")
        .order("first_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateAvailability = async (configId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from("grading_configurations")
        .update({ is_available: isAvailable })
        .eq("id", configId);

      if (error) throw error;

      setGradingConfigs(configs =>
        configs.map(config =>
          config.id === configId
            ? { ...config, is_available: isAvailable }
            : config
        )
      );

      toast({
        title: "Success",
        description: `Grading ${isAvailable ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      console.error("Error updating grading configuration:", error);
      toast({
        title: "Error",
        description: "Failed to update grading configuration.",
        variant: "destructive",
      });
    }
  };

  const moveRank = async (configId: string, direction: 'up' | 'down') => {
    const currentIndex = gradingConfigs.findIndex(config => config.id === configId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === gradingConfigs.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newConfigs = [...gradingConfigs];
    
    // Swap the items
    [newConfigs[currentIndex], newConfigs[newIndex]] = 
    [newConfigs[newIndex], newConfigs[currentIndex]];

    // Update display orders
    const updates = newConfigs.map((config, index) => ({
      id: config.id,
      rank_id: config.rank_id,
      display_order: index + 1
    }));

    try {
      const { error } = await supabase
        .from("grading_configurations")
        .upsert(updates);

      if (error) throw error;

      setGradingConfigs(newConfigs.map((config, index) => ({
        ...config,
        display_order: index + 1
      })));

      toast({
        title: "Success",
        description: "Display order updated successfully.",
      });
    } catch (error) {
      console.error("Error updating display order:", error);
      toast({
        title: "Error",
        description: "Failed to update display order.",
        variant: "destructive",
      });
    }
  };

  const toggleUserPrivilege = async (userId: string, privilege: 'is_instructor' | 'is_admin', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [privilege]: !currentValue })
        .eq("user_id", userId);

      if (error) throw error;

      setUsers(users =>
        users.map(user =>
          user.user_id === userId
            ? { ...user, [privilege]: !currentValue }
            : user
        )
      );

      toast({
        title: "Success",
        description: `User ${privilege === 'is_instructor' ? 'instructor' : 'admin'} privilege ${!currentValue ? 'granted' : 'revoked'} successfully.`,
      });
    } catch (error) {
      console.error("Error updating user privilege:", error);
      toast({
        title: "Error",
        description: "Failed to update user privilege.",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage grading configurations and system settings
          </p>
        </div>

      <Tabs defaultValue="user-management" className="space-y-4">
        <TabsList>
          <TabsTrigger value="user-management">User Management</TabsTrigger>
          <TabsTrigger value="grading-config">Grading Configuration</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="user-management">
          <Card>
            <CardHeader>
              <CardTitle>User Privilege Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Grant or revoke instructor and admin privileges for users.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Users with Privileges */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Users with Privileges</h3>
                  <div className="space-y-2">
                    {users
                      .filter(user => user.is_instructor || user.is_admin)
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="flex gap-2 mt-1">
                              {user.is_instructor && (
                                <Badge variant="secondary">Instructor</Badge>
                              )}
                              {user.is_admin && (
                                <Badge variant="default">Admin</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {user.is_instructor && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserPrivilege(user.user_id, 'is_instructor', user.is_instructor)}
                              >
                                Revoke Instructor
                              </Button>
                            )}
                            {user.is_admin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserPrivilege(user.user_id, 'is_admin', user.is_admin)}
                              >
                                Revoke Admin
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    {users.filter(user => user.is_instructor || user.is_admin).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No users with special privileges found.
                      </p>
                    )}
                  </div>
                </div>

                {/* Regular Users */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Regular Users</h3>
                  <div className="space-y-2">
                    {users
                      .filter(user => !user.is_instructor && !user.is_admin)
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserPrivilege(user.user_id, 'is_instructor', user.is_instructor)}
                            >
                              Grant Instructor
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserPrivilege(user.user_id, 'is_admin', user.is_admin)}
                            >
                              Grant Admin
                            </Button>
                          </div>
                        </div>
                      ))}
                    {users.filter(user => !user.is_instructor && !user.is_admin).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No regular users found.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grading Configuration Tab */}
        <TabsContent value="grading-config">
          <Card>
            <CardHeader>
              <CardTitle>Grading Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure which ranks are available for grading applications and their display order.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gradingConfigs.map((config, index) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge
                        variant={config.rank.dan ? "default" : "secondary"}
                        className="min-w-16 justify-center"
                      >
                        {config.rank.dan ? `${config.rank.dan} Dan` : `${config.rank.kyu} Kyu`}
                      </Badge>
                      <div>
                        <div className="font-medium">{config.rank.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {config.rank.belt_color}
                          {config.rank.stripes > 0 && ` (${config.rank.stripes} Stripe${config.rank.stripes > 1 ? 's' : ''})`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveRank(config.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveRank(config.id, 'down')}
                        disabled={index === gradingConfigs.length - 1}
                      >
                        <ArrowUpDown className="h-4 w-4 rotate-180" />
                      </Button>
                      <Switch
                        checked={config.is_available}
                        onCheckedChange={(checked) => updateAvailability(config.id, checked)}
                      />
                      <span className="text-sm text-muted-foreground min-w-16">
                        {config.is_available ? 'Available' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}