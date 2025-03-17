
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.19, 1, 0.22, 1]
    }
  }
};

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.19, 1, 0.22, 1]
    }
  }
};

export const staggerContainer = (staggerChildren: number, delayChildren: number = 0) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren
    }
  }
});

export const slideInRight = (delay: number = 0) => ({
  hidden: { x: 100, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      delay,
      duration: 0.5,
      ease: [0.19, 1, 0.22, 1]
    }
  }
});

export const slideInLeft = (delay: number = 0) => ({
  hidden: { x: -100, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      delay,
      duration: 0.5,
      ease: [0.19, 1, 0.22, 1]
    }
  }
});

export const blurIn = {
  hidden: { opacity: 0, filter: 'blur(8px)' },
  visible: { 
    opacity: 1, 
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.19, 1, 0.22, 1]
    }
  }
};

export const scaleUp = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.19, 1, 0.22, 1]
    }
  }
};

export const imageReveal = {
  hidden: { clipPath: 'inset(0 100% 0 0)' },
  visible: { 
    clipPath: 'inset(0 0 0 0)',
    transition: {
      duration: 0.8,
      ease: [0.19, 1, 0.22, 1]
    }
  }
};
