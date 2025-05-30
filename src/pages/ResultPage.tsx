import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Home, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

const ResultPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tenantId = searchParams.get('tenantId');
  const token = searchParams.get('token');
  
  const passed = searchParams.get('passed') === 'true';
  const score = parseInt(searchParams.get('score') || '0');
  const [userName, setUserName] = useState("Alex Johnson");
  const [currentDate, setCurrentDate] = useState("");
  
  useEffect(() => {
    // Format the current date
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  }, []);
  
  const handleReturnToDashboard = () => {
    navigate(`/dashboard?tenantId=${tenantId}&token=${token}`);
  };
  
  const getCourseTitle = () => {
    switch(courseId) {
      case "1": return "Data Privacy Compliance";
      case "2": return "Information Security Basics";
      case "3": return "Anti-Harassment Training";
      default: return "Course";
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to={`/course/${courseId}`} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-semibold truncate">
              {getCourseTitle()} - Results
            </h1>
          </div>
          <Button variant="outline" onClick={handleReturnToDashboard}>
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>
      
      <main className="flex-grow pt-8 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {passed ? (
            <div className="border-8 border-complybrand-200 p-8 bg-white shadow-lg">
              <div className="flex justify-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-complybrand-800 mb-6">Certificate of Completion</h2>
              <p className="text-xl mb-8">This certifies that</p>
              <p className="text-2xl font-bold mb-8">{userName}</p>
              <p className="text-xl mb-8">has successfully completed the course</p>
              <p className="text-2xl font-bold text-complybrand-700 mb-8">
                {getCourseTitle()}
              </p>
              <p className="text-lg mb-4">Issue Date: {currentDate}</p>
              <p className="text-lg mb-8">Final Score: {score}%</p>
              <div className="mt-12 border-t border-gray-200 pt-4">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Signature.png" 
                  alt="Signature" 
                  className="h-12 mx-auto mb-2" 
                />
                <p className="font-medium">Jennifer Wilson</p>
                <p className="text-sm text-gray-500">Course Instructor</p>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleReturnToDashboard}
                  className="bg-complybrand-700 hover:bg-complybrand-800"
                >
                  Return to Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  Print Certificate
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-8 shadow-lg">
              <div className="flex justify-center mb-6">
                <AlertCircle className="h-12 w-12 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                You didn't pass the assessment
              </h2>
              <p className="text-gray-600 mb-4">
                Your score: <span className="font-bold">{score}%</span>
              </p>
              <p className="text-gray-600 mb-8">
                Don't worry! You can review the course content and try again.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate(`/course/${courseId}/play`)}
                  variant="outline"
                >
                  Review Course
                </Button>
                <Button
                  onClick={() => navigate(`/course/${courseId}/quiz`)}
                  className="bg-complybrand-700 hover:bg-complybrand-800"
                >
                  Try Quiz Again
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
