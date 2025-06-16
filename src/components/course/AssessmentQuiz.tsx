// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { Progress } from "@/components/ui/progress";
// import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

// interface Question {
//   id: string;
//   question: string;
//   options: { id: string; text: string }[];
//   correctOptionId: string;
// }

// interface AssessmentQuizProps {
//   questions: Question[];
//   passingScore: number;
//   onComplete: (passed: boolean, score: number) => void;
// }

// const AssessmentQuiz = ({
//   questions,
//   passingScore,
//   onComplete,
// }: AssessmentQuizProps) => {
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [answers, setAnswers] = useState<Record<string, string>>({});
//   const [quizSubmitted, setQuizSubmitted] = useState(false);
//   const [showExplanation, setShowExplanation] = useState(false);

//   const currentQuestion = questions[currentQuestionIndex];
//   const totalQuestions = questions.length;
//   const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

//   const handleSelectOption = (optionId: string) => {
//     setAnswers({
//       ...answers,
//       [currentQuestion.id]: optionId,
//     });
//   };

//   const handleNext = () => {
//     if (currentQuestionIndex < totalQuestions - 1) {
//       setCurrentQuestionIndex(currentQuestionIndex + 1);
//     }
//   };

//   const handlePrevious = () => {
//     if (currentQuestionIndex > 0) {
//       setCurrentQuestionIndex(currentQuestionIndex - 1);
//     }
//   };

//   const handleSubmit = () => {
//     setQuizSubmitted(true);

//     // Calculate score
//     const correctAnswers = questions.filter(
//       (question) => answers[question.id] === question.correctOptionId
//     ).length;

//     const score = Math.round((correctAnswers / totalQuestions) * 100);
//     const passed = score >= passingScore;

//     onComplete(passed, score);
//   };

//   const isCurrentQuestionAnswered = !!answers[currentQuestion?.id];
//   const areAllQuestionsAnswered = questions.every((q) => !!answers[q.id]);

//   const getResultFeedback = () => {
//     const correctAnswers = questions.filter(
//       (question) => answers[question.id] === question.correctOptionId
//     ).length;

//     const score = Math.round((correctAnswers / totalQuestions) * 100);
//     const passed = score >= passingScore;

//     if (passed) {
//       return {
//         icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
//         title: "Congratulations!",
//         message: `You've passed with a score of ${score}%. You answered ${correctAnswers} out of ${totalQuestions} questions correctly.`,
//         buttonText: "Download Certificate",
//       };
//     } else {
//       return {
//         icon: <AlertCircle className="h-12 w-12 text-yellow-500" />,
//         title: "Not Quite There",
//         message: `You scored ${score}%, but you need ${passingScore}% to pass. You answered ${correctAnswers} out of ${totalQuestions} questions correctly.`,
//         buttonText: "Try Again",
//       };
//     }
//   };

//   if (quizSubmitted) {
//     const feedback = getResultFeedback();

//     return (
//       <Card className="max-w-3xl mx-auto">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-4">{feedback.icon}</div>
//           <CardTitle className="text-2xl">{feedback.title}</CardTitle>
//           <CardDescription>{feedback.message}</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <Button
//               className="w-full bg-complybrand-700 hover:bg-complybrand-800"
//               onClick={() =>
//                 onComplete(
//                   feedback.title === "Congratulations!",
//                   parseInt(feedback.message.match(/\d+/)![0])
//                 )
//               }
//             >
//               {feedback.buttonText}
//             </Button>

//             {feedback.title !== "Congratulations!" && (
//               <Button
//                 variant="outline"
//                 className="w-full"
//                 onClick={() => {
//                   setQuizSubmitted(false);
//                   setCurrentQuestionIndex(0);
//                   setShowExplanation(true);
//                 }}
//               >
//                 Review Questions
//               </Button>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <>
//       <Card className="max-w-3xl mx-auto">
//         <CardHeader>
//           <div className="flex justify-between items-center mb-2">
//             <CardTitle>Assessment Quiz</CardTitle>
//             <span className="text-sm text-gray-500">
//               Question {currentQuestionIndex + 1} of {totalQuestions}
//             </span>
//           </div>
//           <Progress value={progress} className="h-2" />
//         </CardHeader>

//         <CardContent className="space-y-6">
//           <div className="text-lg font-medium">{currentQuestion.question}</div>

//           <RadioGroup
//             value={answers[currentQuestion.id] || ""}
//             onValueChange={handleSelectOption}
//           >
//             {currentQuestion.options.map((option) => {
//               const isSelected = answers[currentQuestion.id] === option.id;
//               const isCorrect = option.id === currentQuestion.correctOptionId;
//               let optionClass = "";

//               if (showExplanation) {
//                 if (isCorrect) {
//                   optionClass = "border-green-500 bg-green-50";
//                 } else if (isSelected) {
//                   optionClass = "border-red-500 bg-red-50";
//                 }
//               }

//               return (
//                 <div
//                   key={option.id}
//                   className={`flex items-center space-x-2 p-3 border rounded-md mb-3 ${
//                     isSelected && !showExplanation
//                       ? "border-complybrand-500 bg-complybrand-50"
//                       : ""
//                   } ${optionClass} ${
//                     showExplanation ? "cursor-default" : "cursor-pointer"
//                   }`}
//                 >
//                   <RadioGroupItem
//                     value={option.id}
//                     id={option.id}
//                     disabled={showExplanation}
//                   />
//                   <Label
//                     htmlFor={option.id}
//                     className="flex-grow cursor-pointer"
//                   >
//                     {option.text}
//                   </Label>

//                   {showExplanation && (
//                     <div className="ml-2">
//                       {isCorrect ? (
//                         <CheckCircle2 className="h-5 w-5 text-green-500" />
//                       ) : isSelected ? (
//                         <XCircle className="h-5 w-5 text-red-500" />
//                       ) : null}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </RadioGroup>
//         </CardContent>

//         <CardFooter className="flex justify-between">
//           <Button
//             variant="outline"
//             onClick={handlePrevious}
//             disabled={currentQuestionIndex === 0}
//           >
//             Previous
//           </Button>

//           <div className="flex gap-2">
//             {currentQuestionIndex === totalQuestions - 1 ? (
//               <Button
//                 className="bg-complybrand-700 hover:bg-complybrand-800"
//                 disabled={!areAllQuestionsAnswered}
//                 onClick={handleSubmit}
//               >
//                 Submit Quiz
//               </Button>
//             ) : (
//               <Button
//                 className="bg-complybrand-700 hover:bg-complybrand-800"
//                 disabled={!isCurrentQuestionAnswered}
//                 onClick={handleNext}
//               >
//                 Next
//               </Button>
//             )}
//           </div>
//         </CardFooter>
//       </Card>
//       <p className="text-xs text-gray-500 text-center mt-4 max-w-3xl mx-auto">
//         All names, symbols, and references used in this content are purely
//         fictional and intended for educational or illustrative purposes only.
//         Any resemblance to real persons, living or dead, or actual organizations
//         is purely coincidental.
//       </p>
//     </>
//   );
// };
// export default AssessmentQuiz;