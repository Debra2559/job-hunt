import { motion } from 'framer-motion';
import { quickTags } from '@/data/campusData';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface QuickTagsProps {
  onTagClick: (message: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

export function QuickTags({ onTagClick }: QuickTagsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 max-w-2xl mx-auto"
    >
      {quickTags.slice(0, 4).map((tag) => (
        <motion.button
          key={tag.id}
          variants={itemVariants}
          whileHover={{ 
            scale: 1.03, 
            y: -4,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onTagClick(tag.description)}
          className={cn(
            "group p-5 rounded-2xl text-left transition-all duration-300",
            "bg-card border border-border/60 shadow-elegant",
            "hover:border-primary/40 hover:shadow-lg",
            "hover:bg-gradient-to-br hover:from-white hover:to-accent/30"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="font-semibold text-foreground text-sm mb-1.5 group-hover:text-primary transition-colors">
                {tag.title}
              </div>
              <div className="text-muted-foreground text-xs leading-relaxed">
                {tag.description}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-primary"
            >
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-colors" />
            </motion.div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
