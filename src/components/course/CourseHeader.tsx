import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseHeaderProps } from "@/types/CourseHeader";

const CourseHeader = ({ courseTitle, onReturn }: CourseHeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{courseTitle}</h1>
        <Button variant="outline" onClick={onReturn}>
          Return to Dashboard
        </Button>
      </div>
    </header>
  );
};

export default CourseHeader;
