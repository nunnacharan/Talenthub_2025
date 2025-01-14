import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EyeIcon, EyeOffIcon, Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logo from './images/logo.png';
import TalentHubImage from './images/talenthub.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        const userData = data.user;
        const token = data.token;
        localStorage.setItem('user', JSON.stringify({ 
          id: userData.id, 
          role: userData.role, 
          email: userData.email 
        }));
        localStorage.setItem('token', token);

        if (userData.role === 'admin') navigate('/admin-dashboard');
        else if (userData.role === 'power_user') navigate('/power-user-dashboard');
        else if (userData.role === 'user') navigate('/user-details', { state: { candidate: data } });
      } else {
        throw new Error(data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-[#15BACD] to-[#094DA2] font-roboto text-lg">
      {/* Left Section */}
      <div className="hidden md:flex flex-1 justify-center items-center relative bg-gradient-to-r from-[#15BACD] to-[#094DA2]">
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-90 transition-opacity duration-500 hover:opacity-100" 
          style={{ backgroundImage: `url(${logo})` }}
        />
        <div className="absolute inset-0 flex justify-center items-center text-center text-white z-10">
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white p-6 md:p-12 relative">
        <div className="w-full max-w-[450px] space-y-8 md:space-y-10">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4 animate-fade-in justify-center">
            <img 
              src={TalentHubImage} 
              alt="TalentHub Logo" 
              className="w-[50px] h-[70px] transform hover:scale-105 transition-transform duration-300"
            />
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#15BACD] to-[#094DA2]">
              TalentHub
            </h1>
          </div>

          {/* Heading */}
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800 text-center">
            Welcome Back! Please Login to Continue
          </h3>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-[50px] p-4 text-lg text-gray-800 border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-[50px] p-4 text-lg text-gray-800 border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#15BACD] to-[#094DA2] text-white rounded-xl hover:scale-105 transition-transform duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Forgot your password?{' '}
              <button
                onClick={() => navigate('/forgot-password')}
                className="text-[#15BACD] hover:text-[#094DA2] transition-colors duration-300 hover:underline focus:outline-none"
              >
                Reset it here
              </button>
            </p>
          </div>
           {/* Error Message - Positioned absolutely */}
           {error && (
            <div className="absolute  left-1/2 transform -translate-x-1/2 w-full max-w-[450px] px-4">
              <Alert className="bg-red-50 border border-red-200 text-red-600 relative">
                <AlertDescription>{error}</AlertDescription>
                <button
                  onClick={() => setError('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
