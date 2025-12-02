/**
 * Framer Motion Animation Presets
 *
 * Centralized animation configurations for consistent motion design
 * across the PBM application. All animations follow modern dashboard
 * principles with smooth, purposeful motion.
 */

// ===== TRANSITION PRESETS =====

export const transitions = {
  // Fast transitions for subtle effects
  fast: {
    duration: 0.15,
    ease: "easeInOut",
  },

  // Normal transitions for most UI elements
  normal: {
    duration: 0.2,
    ease: "easeInOut",
  },

  // Slow transitions for emphasized effects
  slow: {
    duration: 0.3,
    ease: "easeInOut",
  },

  // Spring animation for bouncy effects
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },

  // Smooth spring for gentler bounce
  smoothSpring: {
    type: "spring",
    stiffness: 200,
    damping: 25,
  },

  // Snappy spring for quick response
  snappySpring: {
    type: "spring",
    stiffness: 400,
    damping: 40,
  },
};

// ===== FADE VARIANTS =====

export const fadeVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    transition: transitions.fast,
  },
};

export const fadeUpVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: transitions.fast,
  },
};

export const fadeDownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: 5,
    transition: transitions.fast,
  },
};

export const fadeLeftVariants = {
  hidden: {
    opacity: 0,
    x: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    x: 5,
    transition: transitions.fast,
  },
};

export const fadeRightVariants = {
  hidden: {
    opacity: 0,
    x: 10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    x: -5,
    transition: transitions.fast,
  },
};

// ===== SCALE VARIANTS =====

export const scaleVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

export const scaleUpVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.smoothSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: transitions.fast,
  },
};

export const popVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: transitions.fast,
  },
};

// ===== MODAL/DIALOG VARIANTS =====

export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: transitions.fast,
  },
};

export const drawerVariants = {
  hidden: (direction = "right") => ({
    x: direction === "right" ? "100%" : direction === "left" ? "-100%" : 0,
    y: direction === "bottom" ? "100%" : direction === "top" ? "-100%" : 0,
  }),
  visible: {
    x: 0,
    y: 0,
    transition: transitions.slow,
  },
  exit: (direction = "right") => ({
    x: direction === "right" ? "100%" : direction === "left" ? "-100%" : 0,
    y: direction === "bottom" ? "100%" : direction === "top" ? "-100%" : 0,
    transition: transitions.normal,
  }),
};

export const backdropVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    transition: transitions.normal,
  },
};

// ===== LIST/STAGGER VARIANTS =====

export const listContainerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const listItemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: transitions.fast,
  },
};

export const gridContainerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.03,
    },
  },
};

export const gridItemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.normal,
  },
};

// ===== CARD VARIANTS =====

export const cardHoverVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "var(--shadow-md)",
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "var(--shadow-lg)",
    transition: transitions.normal,
  },
  tap: {
    scale: 0.98,
    transition: transitions.fast,
  },
};

export const cardPressVariants = {
  rest: {
    scale: 1,
  },
  tap: {
    scale: 0.97,
    transition: transitions.fast,
  },
};

// ===== NOTIFICATION/TOAST VARIANTS =====

export const toastVariants = {
  hidden: (position = "top") => ({
    opacity: 0,
    y: position === "top" ? -20 : position === "bottom" ? 20 : 0,
    x: position === "left" ? -20 : position === "right" ? 20 : 0,
    scale: 0.95,
  }),
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: transitions.smoothSpring,
  },
  exit: (position = "top") => ({
    opacity: 0,
    y: position === "top" ? -10 : position === "bottom" ? 10 : 0,
    x: position === "left" ? -10 : position === "right" ? 10 : 0,
    scale: 0.95,
    transition: transitions.normal,
  }),
};

// ===== COLLAPSE/EXPAND VARIANTS =====

export const collapseVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    transition: transitions.normal,
  },
  expanded: {
    height: "auto",
    opacity: 1,
    overflow: "visible",
    transition: transitions.normal,
  },
};

export const accordionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: transitions.normal,
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: transitions.normal,
  },
};

// ===== BUTTON VARIANTS =====

export const buttonTapVariants = {
  tap: {
    scale: 0.95,
    transition: transitions.fast,
  },
};

export const buttonHoverVariants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: transitions.fast,
  },
  tap: {
    scale: 0.95,
    transition: transitions.fast,
  },
};

// ===== SKELETON/LOADING VARIANTS =====

export const skeletonPulseVariants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const shimmerVariants = {
  shimmer: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const spinnerVariants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// ===== PAGE TRANSITION VARIANTS =====

export const pageVariants = {
  initial: {
    opacity: 0,
    x: -10,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: transitions.normal,
  },
};

export const pageSlideVariants = {
  initial: (direction = 1) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
  }),
  enter: {
    opacity: 1,
    x: 0,
    transition: transitions.slow,
  },
  exit: (direction = 1) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
    transition: transitions.normal,
  }),
};

// ===== UTILITY FUNCTIONS =====

/**
 * Create custom stagger container
 * @param {number} staggerDelay - Delay between each child animation (seconds)
 * @param {object} options - Additional options
 */
export const createStaggerContainer = (staggerDelay = 0.05, options = {}) => ({
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: staggerDelay,
      ...options,
    },
  },
});

/**
 * Create custom fade variant
 * @param {object} from - Initial state
 * @param {object} to - Final state
 * @param {object} transition - Transition configuration
 */
export const createFadeVariant = (from = {}, to = {}, transition = transitions.normal) => ({
  hidden: {
    opacity: 0,
    ...from,
  },
  visible: {
    opacity: 1,
    ...to,
    transition,
  },
  exit: {
    opacity: 0,
    ...from,
    transition: transitions.fast,
  },
});

/**
 * Combine multiple animation variants
 * @param  {...object} variants - Animation variant objects to combine
 */
export const combineVariants = (...variants) => {
  return variants.reduce((acc, variant) => {
    Object.keys(variant).forEach(key => {
      acc[key] = { ...acc[key], ...variant[key] };
    });
    return acc;
  }, {});
};

// ===== EXPORT ALL =====

export default {
  transitions,
  fadeVariants,
  fadeUpVariants,
  fadeDownVariants,
  fadeLeftVariants,
  fadeRightVariants,
  scaleVariants,
  scaleUpVariants,
  popVariants,
  modalVariants,
  drawerVariants,
  backdropVariants,
  listContainerVariants,
  listItemVariants,
  gridContainerVariants,
  gridItemVariants,
  cardHoverVariants,
  cardPressVariants,
  toastVariants,
  collapseVariants,
  accordionVariants,
  buttonTapVariants,
  buttonHoverVariants,
  skeletonPulseVariants,
  shimmerVariants,
  spinnerVariants,
  pageVariants,
  pageSlideVariants,
  createStaggerContainer,
  createFadeVariant,
  combineVariants,
};
