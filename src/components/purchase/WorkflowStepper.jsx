import React from 'react';
import { FileText, Phone, Truck, ShoppingCart, Receipt } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import '../../styles/WorkflowStepper.css';

/**
 * WorkflowStepper Component
 *
 * Visual guide showing the purchase workflow progression:
 * Contracts → Callouts → WCN/Collection → PO → Bill
 *
 * @param {string} activeTab - Current active tab ('orders', 'collections', 'expenses', 'vendors')
 * @param {function} onStepClick - Callback when a step is clicked
 */
const WorkflowStepper = ({ activeTab = 'orders', onStepClick }) => {
  const { t } = useLocalization();

  const workflowSteps = [
    {
      id: 'contracts',
      label: t('contracts'),
      icon: <FileText size={20} />,
      description: t('workflowContractsDesc'),
      tab: null, // External - redirects to /contracts
      href: '/contracts',
      position: 1
    },
    {
      id: 'callouts',
      label: t('callouts'),
      icon: <Phone size={20} />,
      description: t('workflowCalloutsDesc'),
      tab: 'collections', // Part of collections workflow
      position: 2
    },
    {
      id: 'wcn',
      label: t('wcnCollection'),
      icon: <Truck size={20} />,
      description: t('workflowWcnDesc'),
      tab: 'collections',
      position: 3
    },
    {
      id: 'po',
      label: t('purchaseOrders'),
      icon: <ShoppingCart size={20} />,
      description: t('workflowPoDesc'),
      tab: 'orders',
      position: 4
    },
    {
      id: 'bill',
      label: t('bills'),
      icon: <Receipt size={20} />,
      description: t('workflowBillDesc'),
      tab: 'orders', // Bills are managed within orders
      position: 5
    }
  ];

  const getStepStatus = (step) => {
    if (!step.tab) {
      // External step (contracts) - check if we've completed it (assume yes if we're in purchase module)
      return 'completed';
    }

    if (step.tab === activeTab) {
      return 'active';
    }

    // Determine if step is completed based on workflow order
    const currentStep = workflowSteps.find(s => s.tab === activeTab);
    if (!currentStep) {
      return 'pending';
    }

    return step.position < currentStep.position ? 'completed' : 'pending';
  };

  const handleStepClick = (step) => {
    if (step.href) {
      // External link (contracts)
      window.location.href = step.href;
    } else if (step.tab && onStepClick) {
      // Internal tab navigation
      onStepClick(step.tab);
    }
  };

  const isStepClickable = (step) => {
    // Contracts is always clickable (external link)
    if (step.href) return true;

    // Other steps are clickable if they have a tab
    return !!step.tab;
  };

  return (
    <div className="workflow-stepper">
      <div className="workflow-header">
        <h3 className="workflow-title">{t('purchaseWorkflow')}</h3>
        <p className="workflow-subtitle">{t('workflowSubtitle')}</p>
      </div>

      <div className="workflow-steps">
        {workflowSteps.map((step, index) => {
          const status = getStepStatus(step);
          const isClickable = isStepClickable(step);
          const isLast = index === workflowSteps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div
                className={`workflow-step ${status} ${isClickable ? 'clickable' : ''}`}
                onClick={() => isClickable && handleStepClick(step)}
                title={step.description}
                role={isClickable ? 'button' : 'div'}
                tabIndex={isClickable ? 0 : -1}
                onKeyPress={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    handleStepClick(step);
                  }
                }}
              >
                <div className="step-icon-wrapper">
                  <div className="step-icon">
                    {step.icon}
                  </div>
                  {status === 'completed' && (
                    <div className="step-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="step-content">
                  <div className="step-label">{step.label}</div>
                  <div className="step-number">
                    {t('step')} {step.position}
                  </div>
                </div>
                {status === 'active' && (
                  <div className="step-indicator">{t('currentStep')}</div>
                )}
              </div>

              {!isLast && (
                <div className={`workflow-connector ${status === 'completed' ? 'completed' : ''}`}>
                  <div className="connector-line" />
                  <div className="connector-arrow">→</div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
};

export default WorkflowStepper;
