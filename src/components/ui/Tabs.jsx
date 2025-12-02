import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import './Tabs.css';

/**
 * Tabs Root Component
 */
export const Tabs = React.forwardRef(({ className = '', ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={`tabs-root ${className}`}
    {...props}
  />
));
Tabs.displayName = 'Tabs';

/**
 * Tabs List Component
 *
 * Container for tab triggers
 *
 * @param {'line'|'enclosed'|'pills'} variant - Tab list style variant
 */
export const TabsList = React.forwardRef(
  ({ className = '', variant = 'line', ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={`tabs-list tabs-list-${variant} ${className}`}
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

/**
 * Tabs Trigger Component
 *
 * Individual tab button
 */
export const TabsTrigger = React.forwardRef(
  ({ className = '', children, ...props }, ref) => {
    const [isActive, setIsActive] = React.useState(false);

    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={`tabs-trigger ${className}`}
        onMouseEnter={() => setIsActive(true)}
        onMouseLeave={() => setIsActive(false)}
        {...props}
      >
        {children}
      </TabsPrimitive.Trigger>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

/**
 * Tabs Content Component
 *
 * Content area for each tab
 */
export const TabsContent = React.forwardRef(
  ({ className = '', children, animated = true, ...props }, ref) => {
    if (animated) {
      return (
        <TabsPrimitive.Content
          ref={ref}
          className={`tabs-content ${className}`}
          asChild
          {...props}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </TabsPrimitive.Content>
      );
    }

    return (
      <TabsPrimitive.Content
        ref={ref}
        className={`tabs-content ${className}`}
        {...props}
      >
        {children}
      </TabsPrimitive.Content>
    );
  }
);
TabsContent.displayName = 'TabsContent';

/**
 * Example Usage:
 *
 * <Tabs defaultValue="tab1">
 *   <TabsList variant="line">
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *     <TabsTrigger value="tab3">Tab 3</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content for Tab 1</TabsContent>
 *   <TabsContent value="tab2">Content for Tab 2</TabsContent>
 *   <TabsContent value="tab3">Content for Tab 3</TabsContent>
 * </Tabs>
 */

export default Tabs;
