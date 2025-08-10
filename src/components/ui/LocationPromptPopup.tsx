import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import UserLocationDisplay from "./UserLocationDisplay";

export default function LocationPromptPopup({
  showLocationPrompt,
  setShowLocationPrompt,
  handleLocationUpdate,
  handleLocationPermissionGranted,
  handleLocationPermissionDenied,
}) {
  // 🔒 Lock/unlock background scroll
  useEffect(() => {
    if (showLocationPrompt) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showLocationPrompt]);

  // 🎹 Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLocationPrompt(false);
      }
    };
    if (showLocationPrompt) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showLocationPrompt, setShowLocationPrompt]);

  return (
    <AnimatePresence>
      {showLocationPrompt && (
        <>
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 backdrop-blur-sm bg-black/40"
            onClick={() => setShowLocationPrompt(false)}
          />

          {/* Popup Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                       rounded-lg shadow-2xl w-full max-w-lg outline-none border-0"
            style={{
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <UserLocationDisplay
              onLocationUpdate={handleLocationUpdate}
              onPermissionGranted={handleLocationPermissionGranted}
              onPermissionDenied={handleLocationPermissionDenied}
              className="w-full"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
