import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import ContactForm from "@/components/landing/ContactForm";
import { UserRole } from "../App";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface IndexProps {
  setUserRole: (role: UserRole) => void;
}

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "Global Finance Inc.",
      content:
        "ComplyQuick has transformed our compliance training program. We've seen a 40% increase in completion rates and our employees actually enjoy the training now!",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
    },
    {
      name: "Michael Chen",
      role: "Compliance Officer",
      company: "Tech Solutions LLC",
      content:
        "The analytics provided by ComplyQuick give me real-time insights into our compliance posture. It's incredibly powerful and easy to use.",
      image:
        "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      name: "Jessica Williams",
      role: "Training Manager",
      company: "Healthcare Partners",
      content:
        "The customizable courses allowed us to create training specific to healthcare regulations. Our certification process is now seamless.",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXZhdGFyfGVufDB8fDB8fHww",
    },
  ];

  return (
    <div className="py-24 bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-100 dark:bg-yellow-900/10 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base font-semibold uppercase tracking-wide bg-gradient-to-r from-complybrand-700 to-blue-500 dark:from-complybrand-400 dark:to-blue-300 bg-clip-text text-transparent"
          >
            Testimonials
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl"
          >
            Trusted by industry leaders
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto"
          >
            See what our customers have to say about their experience with
            ComplyQuick.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={testimonial.name}
                  className="md:basis-1/1 lg:basis-1/1"
                >
                  <Card className="border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-24 h-24 overflow-hidden rounded-full border-4 border-white dark:border-gray-800 shadow-lg">
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className="w-5 h-5 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 italic mb-4">
                            "{testimonial.content}"
                          </p>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {testimonial.name}
                            </h4>
                            <p className="text-gray-500 dark:text-gray-400">
                              {testimonial.role}, {testimonial.company}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-2 mt-6">
              <CarouselPrevious className="relative left-0 translate-y-0" />
              <CarouselNext className="relative right-0 translate-y-0" />
            </div>
          </Carousel>
        </motion.div>
      </div>
    </div>
  );
};

const TrustedBy = () => {
  const companies = [
    "Acme Corp",
    "GlobalTech",
    "InnovateCo",
    "Secure Systems",
    "FutureCorp",
    "MegaCorp",
  ];

  return (
    <div className="py-16 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide"
        >
          Trusted by over 500+ companies
        </motion.p>
        <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-6">
          {companies.map((company, i) => (
            <motion.div
              key={company}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="col-span-1 flex justify-center"
            >
              <div className="h-8 text-gray-400 dark:text-gray-500 font-bold text-xl">
                {company}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Index = ({ setUserRole }: IndexProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Navbar onLogin={setUserRole} />
      <main className="flex-grow">
        <Hero />
        <TrustedBy />
        <Features />
        <Testimonials />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
