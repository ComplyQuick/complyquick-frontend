import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";

const CourseNotFound: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId');
  const token = searchParams.get('token');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="mb-4">The course you're looking for doesn't exist or has been removed.</p>
          <Link to={`/dashboard?tenantId=${tenantId}&token=${token}`}>
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CourseNotFound;
