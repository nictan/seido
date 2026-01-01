import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import seidoLogo from "@/assets/seido-logo.png";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Please select a gender" }),
  mobile: z.string().trim().min(8, "Mobile number must be at least 8 digits").max(15, "Mobile number must be less than 15 digits"),
  school: z.enum(["TP", "SIT", "HQ"], { required_error: "Please select a school" }),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters")
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [mobile, setMobile] = useState("");
  const [school, setSchool] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setGender("");
    setMobile("");
    setSchool("");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({ title: "Welcome back!" });
        // Navigation will be handled by useAuth effect
      } else {
        // Validate signup form
        const formData = {
          firstName,
          lastName,
          dateOfBirth,
          gender,
          mobile,
          school,
          email,
          password
        };

        const validation = signupSchema.safeParse(formData);
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((error) => {
            if (error.path[0]) {
              fieldErrors[error.path[0] as string] = error.message;
            }
          });
          setErrors(fieldErrors);
          return;
        }

        const { error } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          gender,
          mobile,
          dojo: school
        });
        
        if (error) throw error;
        toast({ title: "Account created! Please check your email to verify." });
        clearForm();
        setIsLogin(true); // Redirect to login page
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md dojo-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={seidoLogo} alt="Seido" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">SEIDO</CardTitle>
          <CardDescription>
            Hayashi-Ha Shitoryu Singapore Student Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">{errors.gender}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile *</Label>
                  <Input
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Mobile number"
                  />
                  {errors.mobile && (
                    <p className="text-sm text-destructive">{errors.mobile}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">School *</Label>
                  <Select value={school} onValueChange={setSchool}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TP">Temasek Polytechnic</SelectItem>
                      <SelectItem value="SIT">Singapore Institute of Technology</SelectItem>
                      <SelectItem value="HQ">Headquarters</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.school && (
                    <p className="text-sm text-destructive">{errors.school}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "Password" : "Password (min 6 characters)"}
                required
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin);
                clearForm();
              }}
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}