import React from 'react';
import { motion } from 'framer-motion';
import {
  Inbox,
  FileX,
  Search,
  AlertCircle,
  Package,
  Users,
  FileText,
  Database,
  FolderOpen,
} from 'lucide-react';
import { fadeUpVariants } from '../../config/animations';
import './EmptyState.css';

/**
 * Empty State Component
 *
 * Display when there's no data to show
 *
 * @param {React.ReactNode} icon - Custom icon (or use iconName)
 * @param {string} iconName - Predefined icon name
 * @param {string} title - Main title text
 * @param {string} description - Description text
 * @param {React.ReactNode} action - Action button/element
 * @param {'sm'|'md'|'lg'} size - Component size
 * @param {string} className - Additional CSS classes
 */
const EmptyState = ({
  icon: customIcon,
  iconName = 'inbox',
  title,
  description,
  action,
  size = 'md',
  className = '',
}) => {
  const getIcon = () => {
    const iconMap = {
      inbox: Inbox,
      file: FileX,
      search: Search,
      error: AlertCircle,
      package: Package,
      users: Users,
      document: FileText,
      database: Database,
      folder: FolderOpen,
    };

    const IconComponent = iconMap[iconName] || Inbox;
    return <IconComponent className="empty-state-icon" />;
  };

  const icon = customIcon || getIcon();

  return (
    <motion.div
      className={`empty-state empty-state-${size} ${className}`}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="empty-state-icon-wrapper">
        {icon}
      </div>

      {title && (
        <h3 className="empty-state-title">{title}</h3>
      )}

      {description && (
        <p className="empty-state-description">{description}</p>
      )}

      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Predefined Empty State Variants
 */

export const NoDataEmptyState = ({ action }) => (
  <EmptyState
    iconName="inbox"
    title="No data available"
    description="There are no items to display at the moment."
    action={action}
  />
);

export const NoSearchResultsEmptyState = ({ searchQuery, action }) => (
  <EmptyState
    iconName="search"
    title="No results found"
    description={
      searchQuery
        ? `No results found for "${searchQuery}". Try adjusting your search.`
        : "No results found. Try adjusting your filters."
    }
    action={action}
  />
);

export const NoFilesEmptyState = ({ action }) => (
  <EmptyState
    iconName="file"
    title="No files"
    description="Upload your first file to get started."
    action={action}
  />
);

export const ErrorEmptyState = ({ message, action }) => (
  <EmptyState
    iconName="error"
    title="Something went wrong"
    description={message || "We encountered an error loading this content."}
    action={action}
  />
);

export const NoCustomersEmptyState = ({ action }) => (
  <EmptyState
    iconName="users"
    title="No customers yet"
    description="Create your first customer to start managing relationships."
    action={action}
  />
);

export const NoOrdersEmptyState = ({ action }) => (
  <EmptyState
    iconName="package"
    title="No orders found"
    description="Create your first order to get started with order management."
    action={action}
  />
);

export const NoDocumentsEmptyState = ({ action }) => (
  <EmptyState
    iconName="document"
    title="No documents"
    description="Upload or create your first document."
    action={action}
  />
);

export const DatabaseEmptyState = ({ action }) => (
  <EmptyState
    iconName="database"
    title="No data"
    description="The database is empty. Add some records to get started."
    action={action}
  />
);

export default EmptyState;
