import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function ErrorDialog({ showErrorDialog, setShowErrorDialog, errorMessage }) {
    return (
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <DialogHeader>
              <DialogTitle className="text-red-600">Error</DialogTitle>
              <DialogDescription>{errorMessage}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => setShowErrorDialog(false)}>
                Close
              </button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }