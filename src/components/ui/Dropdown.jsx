import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight } from 'lucide-react';
import './Dropdown.css';

/**
 * Dropdown Menu Root Component
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;

/**
 * Dropdown Menu Trigger Component
 */
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/**
 * Dropdown Menu Portal Component
 */
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

/**
 * Dropdown Menu Content Component
 *
 * The dropdown menu panel with positioning
 */
export const DropdownMenuContent = React.forwardRef(
  ({ className = '', sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={`dropdown-content ${className}`}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

/**
 * Dropdown Menu Item Component
 *
 * Individual menu item
 */
export const DropdownMenuItem = React.forwardRef(
  ({ className = '', inset = false, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={`dropdown-item ${inset ? 'dropdown-item-inset' : ''} ${className}`}
      {...props}
    />
  )
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

/**
 * Dropdown Menu Checkbox Item Component
 *
 * Checkable menu item
 */
export const DropdownMenuCheckboxItem = React.forwardRef(
  ({ className = '', children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={`dropdown-checkbox-item ${className}`}
      checked={checked}
      {...props}
    >
      <span className="dropdown-item-indicator">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="dropdown-check-icon" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
);
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

/**
 * Dropdown Menu Radio Group Component
 */
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/**
 * Dropdown Menu Radio Item Component
 *
 * Radio button menu item
 */
export const DropdownMenuRadioItem = React.forwardRef(
  ({ className = '', children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={`dropdown-radio-item ${className}`}
      {...props}
    >
      <span className="dropdown-item-indicator">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="dropdown-radio-dot" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
);
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

/**
 * Dropdown Menu Label Component
 *
 * Section label within dropdown
 */
export const DropdownMenuLabel = React.forwardRef(
  ({ className = '', inset = false, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={`dropdown-label ${inset ? 'dropdown-label-inset' : ''} ${className}`}
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

/**
 * Dropdown Menu Separator Component
 *
 * Visual separator between menu sections
 */
export const DropdownMenuSeparator = React.forwardRef(
  ({ className = '', ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={`dropdown-separator ${className}`}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

/**
 * Dropdown Menu Sub Component
 *
 * Nested submenu
 */
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/**
 * Dropdown Menu Sub Trigger Component
 *
 * Trigger for opening submenu
 */
export const DropdownMenuSubTrigger = React.forwardRef(
  ({ className = '', inset = false, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={`dropdown-sub-trigger ${inset ? 'dropdown-item-inset' : ''} ${className}`}
      {...props}
    >
      {children}
      <ChevronRight className="dropdown-sub-icon" />
    </DropdownMenuPrimitive.SubTrigger>
  )
);
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

/**
 * Dropdown Menu Sub Content Component
 *
 * Content panel for submenu
 */
export const DropdownMenuSubContent = React.forwardRef(
  ({ className = '', ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={`dropdown-sub-content ${className}`}
      {...props}
    />
  )
);
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

/**
 * Dropdown Menu Group Component
 *
 * Logical grouping of menu items
 */
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/**
 * Example Usage:
 *
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild>
 *     <button>Open Menu</button>
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuLabel>My Account</DropdownMenuLabel>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem>Profile</DropdownMenuItem>
 *     <DropdownMenuItem>Settings</DropdownMenuItem>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem>Logout</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 */

export default {
  Root: DropdownMenu,
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  Label: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
  Group: DropdownMenuGroup,
};
