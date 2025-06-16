import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SendIcon, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          organization: formData.organization,
          message: formData.message
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit contact request');
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Thank you for your message! We'll be in touch soon.", {
        duration: 5000,
      });
      
      // Reset form after showing success state
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          organization: "",
          message: "",
        });
      }, 3000);
    } catch (error) {
      setIsSubmitting(false);
      toast.error("Failed to submit contact request. Please try again later.", {
        duration: 5000,
      });
      console.error('Error submitting contact request:', error);
    }
  };

  return (
    <div id="contact" className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl opacity-30"
        ></motion.div>
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100 dark:bg-purple-900/10 rounded-full blur-3xl opacity-20"
        ></motion.div>
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
            Contact Us
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl"
          >
            Ready to get started?
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto"
          >
            Fill out the form below and one of our team members will get in touch with you shortly.
          </motion.p>
        </motion.div>

        <div className="mt-12 lg:flex lg:items-center lg:gap-8">
          {/* Contact cards */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/3 mb-10 lg:mb-0 space-y-6"
          >
            {[
              { title: "Email", content: "contact@complyquick.com", icon: "✉️" },
              { title: "Phone", content: "+1 (555) 123-4567", icon: "📞" },
              { title: "Address", content: "123 Compliance Way, San Francisco, CA", icon: "📍" }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                whileHover={{ scale: 1.03 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-4">{item.icon}</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">{item.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:w-2/3"
          >
            <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 sm:p-10 hover:shadow-2xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 text-green-500 dark:text-green-400"
                  >
                    <CheckCircle size={60} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Thank you!
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    We've received your message and will get back to you shortly.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="dark:text-gray-300">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Smith"
                      className="hover:border-complybrand-400 transition-colors focus:ring-complybrand-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@company.com"
                        className="hover:border-complybrand-400 transition-colors focus:ring-complybrand-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization" className="dark:text-gray-300">Organization</Label>
                      <Input
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        required
                        placeholder="Company Inc."
                        className="hover:border-complybrand-400 transition-colors focus:ring-complybrand-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="dark:text-gray-300">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Please tell us about your compliance training needs..."
                      className="h-32 hover:border-complybrand-400 transition-colors focus:ring-complybrand-400"
                    />
                  </div>

                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      type="submit"
                      className="w-full py-6 bg-gradient-to-r from-complybrand-700 to-blue-600 hover:from-complybrand-800 hover:to-blue-700 dark:from-complybrand-600 dark:to-blue-500 dark:hover:from-complybrand-700 dark:hover:to-blue-600 transition-all"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center text-white">
                          Submit Request <SendIcon className="ml-2 h-4 w-4 animate-[pulse_2s_infinite]" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
