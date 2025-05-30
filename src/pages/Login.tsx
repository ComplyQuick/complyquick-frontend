import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const requestBody = { 
        email: email.trim(),
        password: password.trim()
      };
      
      console.log('Request URL:', `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`);
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('Request Body Length:', JSON.stringify(requestBody).length);
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      const responseData = await response.json();
      console.log('Full Response:', responseData);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid email or password. Please check your credentials.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your credentials.');
        } else {
          throw new Error(responseData.message || 'Login failed. Please try again.');
        }
      }

      if (!responseData.token) {
        throw new Error('No token received from server');
      }

      // Store the token in localStorage
      localStorage.setItem('token', responseData.token);
      
      // Decode the token to get user role and tenantId
      const tokenPayload = JSON.parse(atob(responseData.token.split('.')[1]));
      console.log('Decoded Token:', tokenPayload);
      
      // Store tenantId if present
      if (tokenPayload.tenantId) {
        localStorage.setItem('tenantId', tokenPayload.tenantId);
      }
      
      // Check if user is SUPER_ADMIN
      if (tokenPayload.role === 'SUPER_ADMIN') {
        toast.success('Login successful!');
        navigate('/superuser/dashboard');
      } else {
        throw new Error('Access denied. Super admin access required.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      // Clear password field on error
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Super Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the super admin dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-complybrand-600 hover:bg-complybrand-700"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login; 