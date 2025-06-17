
// import { Progress } from "@/components/ui/progress";
// import { motion, AnimatePresence } from "framer-motion";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// interface SlideContentProps {
//   title: string;
//   content: string;
//   currentIndex: number;
//   totalSlides: number;
//   progress: number;
//   isPlaying: boolean;
// }

// const SlideContent: React.FC<SlideContentProps> = ({ 
//   title, 
//   content, 
//   currentIndex, 
//   totalSlides,
//   progress,
//   isPlaying
// }) => {
//   return (
//     <>
//       <div className="mb-4">
//         <motion.h2 
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3 }}
//           className="text-2xl font-serif uppercase tracking-wider dark:text-dark-text transition-colors duration-300"
//         >
//           {title}
//         </motion.h2>
//         <motion.p 
//           initial={{ opacity: 0, y: -5 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3, delay: 0.1 }}
//           className="text-gray-500 dark:text-dark-secondaryText font-light"
//         >
//           Slide {currentIndex + 1} of {totalSlides}
//         </motion.p>
//       </div>
      
//       {/* Slide content - simulated PPT slide with corporate style */}
//       <div className="aspect-video bg-gradient-to-br from-white to-gray-100 dark:from-dark-midnight dark:to-dark-charcoal rounded-lg flex items-center justify-center mb-6 relative overflow-hidden transition-all duration-300 hover:shadow-elegant-hover border border-gray-100/50 dark:border-dark-charcoal">
//         <motion.div 
//           key={`slide-${currentIndex}`}
//           initial={{ opacity: 0, scale: 0.95 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.4 }}
//           className="text-center p-8 w-full h-full flex flex-col items-center justify-center"
//         >
//           <p className="text-xl font-serif uppercase tracking-wider dark:text-dark-text transition-colors duration-300 mb-6">{title}</p>
//           <p className="text-gray-700 dark:text-dark-secondaryText font-light">{content}</p>
          
//           {/* Corporate-styled background overlay */}
//           <div className="absolute inset-0 -z-10 opacity-10">
//             <img 
//               src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80" 
//               alt="Corporate Background"
//               className="w-full h-full object-cover opacity-20 dark:opacity-10"
//             />
//             <div className="absolute inset-0 bg-gradient-to-b from-transparent dark:from-black/20 to-white/80 dark:to-black/80"></div>
//           </div>
          
//           {/* Enhanced presenter avatar with animation */}
//           <div className="absolute bottom-4 right-4">
//             <AnimatePresence>
//               {isPlaying && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: 20 }}
//                   transition={{ duration: 0.3 }}
//                   className="relative"
//                 >
//                   <div className="relative overflow-hidden rounded-full border-2 border-white dark:border-dark-secondaryText/30 shadow-md h-20 w-20">
//                     {/* Corporate presenter video background */}
//                     <div className="absolute inset-0">
//                       <div className="w-full h-full relative overflow-hidden">
//                         {/* Corporate setting video placeholder */}
//                         <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-dark-charcoal dark:to-dark-midnight animate-pulse"></div>
                        
//                         {/* Actual video would go here - for now using a placeholder */}
//                         <div className="absolute inset-0 opacity-90 mix-blend-overlay">
//                           <img
//                             src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80"
//                             alt="Corporate Presenter"
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                       </div>
//                     </div>
                    
//                     {/* Animated avatar */}
//                     <div className="relative z-10 h-full w-full flex items-center justify-center">
//                       <Avatar className="h-20 w-20 relative z-10">
//                         <AvatarImage 
//                           src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80" 
//                           alt="Presenter" 
//                           className="object-cover" 
//                         />
//                         <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 dark:from-dark-beige dark:to-dark-tan text-white dark:text-dark-charcoal text-xl">
//                           P
//                         </AvatarFallback>
//                       </Avatar>
                      
//                       {/* Speaking animation overlay - enhanced for corporate style */}
//                       <motion.div
//                         className="absolute inset-0 flex items-end justify-center pb-3"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                       >
//                         <motion.div 
//                           className="flex space-x-1"
//                           animate={{ y: isPlaying ? [0, -3, 0] : 0 }}
//                           transition={{
//                             repeat: Infinity,
//                             repeatType: "mirror",
//                             duration: 0.6,
//                             ease: "easeInOut"
//                           }}
//                         >
//                           {[...Array(3)].map((_, i) => (
//                             <motion.div
//                               key={`wave-${i}`}
//                               className="w-1 h-1 bg-white dark:bg-dark-beige rounded-full"
//                               animate={{
//                                 height: [1, 4 + i * 2, 1],
//                               }}
//                               transition={{
//                                 repeat: Infinity,
//                                 duration: 0.6 + i * 0.1,
//                                 delay: i * 0.1,
//                                 ease: "easeInOut",
//                               }}
//                             />
//                           ))}
//                         </motion.div>
//                       </motion.div>
//                     </div>
//                   </div>
                  
//                   {/* Video indicator */}
//                   <motion.div 
//                     animate={{ scale: [1, 1.05, 1] }}
//                     transition={{ repeat: Infinity, duration: 2 }}
//                     className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 dark:bg-dark-beige rounded-full border-2 border-white dark:border-dark-midnight"
//                   />
                  
//                   {/* Mock audio visualizer for speaking */}
//                   <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col space-y-1">
//                     {[...Array(5)].map((_, i) => (
//                       <motion.div
//                         key={`audio-bar-${i}`}
//                         className="w-1.5 h-6 bg-gray-400 dark:bg-dark-tan/70 rounded-full"
//                         style={{ originY: 1 }}
//                         animate={{ 
//                           scaleY: isPlaying ? [0.3, 0.7 + Math.random() * 0.5, 0.2, 0.8, 0.5] : 0.2,
//                         }}
//                         transition={{
//                           repeat: Infinity,
//                           duration: 0.8 + i * 0.2,
//                           ease: "easeInOut",
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         </motion.div>
        
//         {/* Video progress indicator */}
//         <div className="absolute bottom-0 left-0 w-full">
//           <Progress value={progress} className="rounded-none h-1 transition-all duration-300 bg-gray-200 dark:bg-dark-charcoal" />
//         </div>
//       </div>
//     </>
//   );
// };

// export default SlideContent;
