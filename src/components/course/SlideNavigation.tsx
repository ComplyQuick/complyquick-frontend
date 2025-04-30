import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SlideNavigationProps {
  totalSlides: number;
  currentSlide: number;
  onSlideSelect: (index: number) => void;
  completedSlides: boolean[];
}

const SlideNavigation = ({
  totalSlides,
  currentSlide,
  onSlideSelect,
  completedSlides,
}: SlideNavigationProps) => {
  return (
    <ScrollArea className="h-full rounded-md border dark:border-gray-700">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium">Slide Navigation</h4>
        <div className="flex flex-col gap-2">
          {Array.from({ length: totalSlides }, (_, index) => (
            <Button
              key={index}
              variant={currentSlide === index ? "default" : "outline"}
              className={`w-full h-10 text-left justify-start px-4 ${
                completedSlides[index] ? "border-green-500" : ""
              }`}
              onClick={() => onSlideSelect(index)}
            >
              Slide {index + 1}
            </Button>
          ))}
        </div>
        </div>
      </ScrollArea>
  );
};

export default SlideNavigation;
