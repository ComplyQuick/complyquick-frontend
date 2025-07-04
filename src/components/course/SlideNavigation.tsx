import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle } from "lucide-react";
import { SlideNavigationProps } from "@/types/course";

const SlideNavigation = ({
  totalSlides,
  currentSlide,
  onSlideSelect,
  slideExplanations,
  progress,
  maxVisitedSlide,
  isAdminView = false,
}: SlideNavigationProps) => {
  const isSlideCompleted = (index: number) => index < currentSlide;
  const isSlideAccessible = (index: number) => {
    if (isAdminView) return true;
    if (index <= maxVisitedSlide) return true;
    if (progress >= 80) return true;
    return false;
  };

  return (
    <ScrollArea className="h-full rounded-md border dark:border-gray-700 w-64 max-w-[260px]">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium">Slide Navigation</h4>
        <div className="flex flex-col gap-2">
          {Array.from({ length: totalSlides }, (_, index) => {
            const completed = isSlideCompleted(index);
            const accessible = isSlideAccessible(index);

            return (
              <Button
                key={index}
                className={`w-full h-auto min-h-[44px] text-left justify-start px-4 flex items-center gap-2
                  rounded-md text-sm font-medium
                  ${
                    completed
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500"
                      : "border border-gray-300 dark:border-gray-700"
                  }
                  ${
                    currentSlide === index ? "bg-gray-200 dark:bg-gray-800" : ""
                  }
                  ${!accessible ? "opacity-50 cursor-not-allowed" : ""}
                `}
                onClick={() => {
                  if (accessible) onSlideSelect(index);
                }}
              >
                <span className="mr-2 flex-shrink-0">{index + 1}</span>
                {completed && (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                )}
                <span className="truncate max-w-[160px]">
                  {slideExplanations[index]?.content || `Slide ${index + 1}`}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};

export default SlideNavigation;
