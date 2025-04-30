
import { 
  Shield, 
  Clock, 
  BarChart, 
  UserCheck, 
  Award,
  Users
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    name: "Custom Compliance Courses",
    description: "Tailor compliance training to your specific industry and organizational needs.",
    icon: Shield,
    color: "#1E40AF",
    bgColor: "#DBEAFE",
    darkBgColor: "#1E3A8A",
  },
  {
    name: "Progress Tracking",
    description: "Track employee progress through courses in real-time with comprehensive reporting.",
    icon: BarChart,
    color: "#0E7490",
    bgColor: "#CFFAFE",
    darkBgColor: "#155E75",
  },
  {
    name: "Automated Certification",
    description: "Automatically issue compliance certificates upon successful course completion.",
    icon: Award,
    color: "#9333EA",
    bgColor: "#F3E8FF",
    darkBgColor: "#6B21A8",
  },
  {
    name: "Time-Efficient",
    description: "Streamlined courses designed to maximize knowledge retention while respecting employees' time.",
    icon: Clock,
    color: "#0369A1",
    bgColor: "#E0F2FE",
    darkBgColor: "#0C4A6E",
  },
  {
    name: "Employee Engagement",
    description: "Interactive content that keeps employees engaged throughout their training journey.",
    icon: UserCheck,
    color: "#16A34A",
    bgColor: "#DCFCE7",
    darkBgColor: "#166534",
  },
  {
    name: "Multi-Tenant Platform",
    description: "Manage multiple organizations with separate user bases and customized training programs.",
    icon: Users,
    color: "#EA580C",
    bgColor: "#FFEDD5",
    darkBgColor: "#9A3412",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      <Card className="relative bg-white dark:bg-gray-800 h-full hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div 
          className={`absolute inset-0 opacity-5 bg-gradient-to-br transition-opacity duration-300 ${isHovered ? 'opacity-10' : 'opacity-5'}`}
          style={{ 
            background: `linear-gradient(135deg, ${feature.bgColor} 0%, ${feature.color}40 100%)`,
          }}
        ></div>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div 
              className="flex h-12 w-12 items-center justify-center rounded-lg text-white transition-all duration-300"
              style={{ 
                backgroundColor: isHovered ? feature.color : feature.bgColor,
                color: isHovered ? 'white' : feature.color 
              }}
            >
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="ml-4 text-xl font-medium text-gray-900 dark:text-white">
              {feature.name}
            </h3>
          </div>
          <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
            {feature.description}
          </p>
          <motion.div 
            className="absolute bottom-2 right-2 w-16 h-16 rounded-full opacity-5"
            style={{ 
              background: isHovered ? feature.color : feature.bgColor,
            }}
            animate={{ 
              scale: isHovered ? [1, 1.2, 1] : 1,
              opacity: isHovered ? [0.1, 0.2, 0.1] : 0.05,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Features = () => {
  return (
    <div id="features" className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-0 w-64 h-64 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-100 dark:bg-purple-900/10 rounded-full blur-3xl opacity-30"></div>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:text-center"
        >
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base font-semibold uppercase tracking-wide bg-gradient-to-r from-complybrand-700 to-blue-500 dark:from-complybrand-400 dark:to-blue-300 bg-clip-text text-transparent"
          >
            Features
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl"
          >
            A better way to manage compliance
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto"
          >
            ComplyQuick provides a comprehensive platform for creating, managing, and tracking compliance training programs.
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20"
        >
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.name} feature={feature} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;
