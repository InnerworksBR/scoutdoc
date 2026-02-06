"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";

export default function LoadingScout() {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="relative flex items-center justify-center"
            >
                <Compass className="w-16 h-16 text-forest-600" strokeWidth={1.5} />
            </motion.div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                className="text-forest-800 font-display font-medium tracking-wide"
            >
                EXPLORANDO DADOS...
            </motion.p>
        </div>
    );
}
