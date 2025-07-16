import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <div className="relative overflow-hidden pt-16 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Full-screen background image with overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent dark:from-black/70 dark:via-black/50 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=2670"
          alt="Corporate Office"
          className="w-full h-full object-cover animate-[pulse_10s_ease-in-out_infinite]"
        />
      </div>

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-complybrand-100/20 dark:bg-complybrand-900/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 -left-24 w-80 h-80 bg-blue-100/20 dark:bg-blue-900/20 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-purple-100/20 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="relative pt-10 pb-20 sm:pb-24 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="sm:text-center md:mx-auto md:max-w-3xl lg:col-span-6 lg:text-left"
            >
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="block transition-all duration-300 hover:translate-x-1"
                >
                  Simplify
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  className="block bg-gradient-to-r from-complybrand-400 to-blue-300 bg-clip-text text-transparent transition-all duration-300 hover:translate-x-2"
                >
                  Compliance Training
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="mt-3 text-base text-gray-100 dark:text-gray-200 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl"
              >
                ComplyQuick is a comprehensive compliance learning platform
                designed to help organizations stay ahead of regulatory
                requirements. Simplify your compliance training with ComplyQuick
                — learning made quick, easy, and effective.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
                className="mt-8 sm:flex sm:justify-center lg:justify-start"
              >
                <div className="rounded-md shadow hover:shadow-lg transition-all duration-300">
                  <a href="#contact">
                    <Button className="w-full flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-complybrand-700 hover:bg-complybrand-800 transition-transform hover:scale-105 dark:bg-complybrand-600 dark:hover:bg-complybrand-700">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 animate-[pulse_2s_infinite]" />
                    </Button>
                  </a>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a href="#features">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center px-8 py-3 text-base font-medium transition-transform hover:scale-105 border-white text-black hover:text-black dark:border-gray-300 dark:text-gray-300 dark:hover:bg-gray-100 dark:hover:text-gray-900"
                    >
                      Learn More
                    </Button>
                  </a>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-12 sm:mt-16 lg:col-span-6 lg:mt-0"
            >
              <div className="relative mx-auto w-full overflow-hidden rounded-xl shadow-xl lg:max-w-md hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-white dark:bg-gray-800">
                <div className="relative block w-full rounded-t-xl">
                  <motion.img
                    initial={{ filter: "blur(10px)" }}
                    animate={{ filter: "blur(0px)" }}
                    transition={{ duration: 1 }}
                    className="w-full transition-opacity duration-300"
                    src="https://i.pinimg.com/736x/21/b7/a8/21b7a887e7ad97a67acb15eabb1279c6.jpg"
                    alt="Compliance Overview"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent flex items-end p-6">
                    <div className="text-white">
                      <h3 className="text-xl font-semibold mb-2">
                        Comprehensive Compliance Solutions
                      </h3>
                      <p className="text-sm text-gray-200">
                        See how we simplify regulations, policies, and
                        governance
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/30 backdrop-blur-md p-4 rounded-full cursor-pointer"
                    >
                      <svg
                        className="h-12 w-12 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="h-1 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="bg-complybrand-500 h-full w-2/3 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Statistics section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="relative z-20 bg-white dark:bg-gray-900 py-12 border-t border-gray-100 dark:border-gray-800"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 1 }}
                className="text-4xl font-bold bg-gradient-to-r from-complybrand-700 to-blue-500 dark:from-complybrand-400 dark:to-blue-300 bg-clip-text text-transparent"
              >
                98%
              </motion.div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Completion Rate
              </p>
            </div>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 1.1 }}
                className="text-4xl font-bold bg-gradient-to-r from-complybrand-700 to-blue-500 dark:from-complybrand-400 dark:to-blue-300 bg-clip-text text-transparent"
              >
                84%
              </motion.div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Knowledge Retention
              </p>
            </div>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 1.2 }}
                className="text-4xl font-bold bg-gradient-to-r from-complybrand-700 to-blue-500 dark:from-complybrand-400 dark:to-blue-300 bg-clip-text text-transparent"
              >
                +500
              </motion.div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Organizations
              </p>
            </div>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 1.3 }}
                className="text-4xl font-bold bg-gradient-to-r from-complybrand-700 to-blue-500 dark:from-complybrand-400 dark:to-blue-300 bg-clip-text text-transparent"
              >
                45%
              </motion.div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Time Saved
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;
