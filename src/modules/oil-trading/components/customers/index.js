/**
 * Customer Components Index
 *
 * Centralized exports for all customer-related components.
 */

// Modal Components
export { default as CustomerFormModal } from './CustomerFormModal'
export { default as CustomerDetailsModal } from './CustomerDetailsModal'
export { default as ContractDetailsModal } from './ContractDetailsModal'
export { default as ContractEditModal } from './ContractEditModal'

// Form Section Components
export {
  FormSection,
  IconInput,
  BasicInfoSection,
  AddressSection,
  BusinessTermsSection,
  ContractTermsSection
} from './FormSections'

// Detail Tab Components
export {
  OverviewTab,
  ContactTab,
  BusinessTab,
  SalesTab,
  ContractTab
} from './DetailsTabs'

// Contract Components
export {
  ContractRatesTable,
  EditableRatesTable,
  EmptyRatesState
} from './ContractRatesTable'

// Attachments
export { default as AttachmentsSection } from './AttachmentsSection'
