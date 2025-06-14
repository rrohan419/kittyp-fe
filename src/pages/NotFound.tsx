import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Search, Package } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
  const navigate = useNavigate();
  const controls = useAnimation();

  useEffect(() => {
    // Start the floating animation sequence
    controls.start({
      y: [0, -20, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    });
  }, [controls]);

  // Floating elements with different animations
  const floatingElements = [
    { icon: Package, delay: 0, size: "w-16 h-16", color: "bg-purple-200" },
    { icon: Search, delay: 0.5, size: "w-20 h-20", color: "bg-pink-200" },
    { icon: Home, delay: 1, size: "w-14 h-14", color: "bg-blue-200" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background animated elements */}
      {floatingElements.map((element, index) => (
        <motion.div
          key={index}
          className={`absolute ${element.color} rounded-full opacity-50 ${element.size}`}
          style={{
            top: `${20 + index * 20}%`,
            left: `${20 + index * 15}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 5 + index,
            repeat: Infinity,
            ease: "easeInOut",
            delay: element.delay,
          }}
        >
          <element.icon className="w-full h-full p-4 text-white opacity-70" />
        </motion.div>
      ))}

      <div className="max-w-4xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Animated 404 Text */}
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            className="relative"
          >
            <motion.h1
              className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
              animate={{
                backgroundPosition: ["0%", "100%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              404
            </motion.h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mt-4"
            />
          </motion.div>

          {/* Message with typing animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-4"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-3xl font-semibold text-gray-800"
            >
              Oops! Page Not Found
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="text-gray-600 max-w-md mx-auto"
            >
              The page you're looking for seems to have vanished into thin air.
              Let's get you back on track!
            </motion.p>
          </motion.div>

          {/* Action Buttons with hover animations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="flex gap-4 justify-center"
          >
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="group relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Go Back
              </span>
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group"
            >
              <motion.div
                className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
                initial={{ scale: 0 }}
                whileHover={{ scale: 2 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative flex items-center">
                <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Back to Home
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
