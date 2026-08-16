import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header with Logo */}
      <header className="w-full bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/899a.png"
              alt="United Church of Christ Logo"
              className="h-16 w-16 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-slate-800">United Church of Christ</h1>
              <p className="text-sm text-slate-600">In The Philippines</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/user/login")}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate("/register")}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Register</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Church Image */}
      <div className="relative">
        <div className="w-full h-[400px] md:h-[500px] overflow-hidden relative">
          <img 
            src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/0fa8.png"
            alt="Church Building"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
          
          {/* Welcome Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
                Welcome to
              </h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white drop-shadow-2xl">
                GSC Members Profile Registration
              </h3>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-lg mt-4">
                Join our community of faith and fellowship. Register today to become part of our growing church family.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button 
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="bg-white text-blue-900 hover:bg-blue-50 shadow-xl text-lg px-8"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Register Now
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/user/login")}
                  className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 shadow-xl text-lg px-8"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Member Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Easy Registration</h3>
            <p className="text-slate-600">
              Simple and quick registration process to join our church community
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Community</h3>
            <p className="text-slate-600">
              Be part of a vibrant and supportive church community
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Profile Management</h3>
            <p className="text-slate-600">
              Manage your information and stay connected with the church
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100020016/899a.png"
              alt="UCCP Logo"
              className="h-12 w-12 object-contain"
            />
            <div className="text-left">
              <p className="font-bold">United Church of Christ in The Philippines</p>
              <p className="text-sm text-slate-400">Founded 1948</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            © 2024 GSC Members Profile Registration. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;