import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET_DATE = new Date('2026-06-25T18:00:00');

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = TARGET_DATE.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeBlocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-12 z-10 relative">
      {timeBlocks.map((block) => (
        <div key={block.label} className="flex flex-col items-center">
          <div className="bg-black/60 border border-primary/30 backdrop-blur-md rounded-lg w-20 h-24 sm:w-24 sm:h-28 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.2)] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={block.value}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-4xl sm:text-5xl font-cinzel font-bold text-primary"
              >
                {block.value.toString().padStart(2, '0')}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="mt-3 text-sm sm:text-base text-accent font-medium uppercase tracking-widest">{block.label}</span>
        </div>
      ))}
    </div>
  );
}
