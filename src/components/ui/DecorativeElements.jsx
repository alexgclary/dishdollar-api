import React from 'react';
import { motion } from 'framer-motion';

export function FloatingVegetables() {
  const vegetables = [
    { emoji: '🥕', delay: 0, x: '10%', y: '20%' },
    { emoji: '🥬', delay: 0.2, x: '85%', y: '15%' },
    { emoji: '🍅', delay: 0.4, x: '5%', y: '70%' },
    { emoji: '🌽', delay: 0.6, x: '90%', y: '60%' },
    { emoji: '🥒', delay: 0.8, x: '15%', y: '45%' },
    { emoji: '🍋', delay: 1, x: '80%', y: '80%' },
    { emoji: '🥦', delay: 1.2, x: '75%', y: '35%' },
    { emoji: '🍆', delay: 1.4, x: '20%', y: '85%' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
      {vegetables.map((veg, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl"
          style={{ left: veg.x, top: veg.y }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: [0, -10, 0],
          }}
          transition={{ 
            delay: veg.delay,
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {veg.emoji}
        </motion.div>
      ))}
    </div>
  );
}

export function WavyBackground() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
      <svg
        className="absolute bottom-0 w-full h-32"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,64 C288,120 576,0 864,64 C1152,128 1440,32 1440,32 L1440,120 L0,120 Z"
          fill="rgba(74, 222, 128, 0.1)"
        />
        <path
          d="M0,80 C360,40 720,100 1080,60 C1260,40 1440,80 1440,80 L1440,120 L0,120 Z"
          fill="rgba(52, 211, 153, 0.08)"
        />
      </svg>
    </div>
  );
}

export function LeafPattern() {
  return (
    <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
      <svg viewBox="0 0 200 200" className="w-full h-full text-green-600">
        <path
          fill="currentColor"
          d="M100,10 Q150,50 150,100 Q150,150 100,190 Q50,150 50,100 Q50,50 100,10 Z"
        />
        <path
          fill="currentColor"
          d="M100,30 L100,170"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}