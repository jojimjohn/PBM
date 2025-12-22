/**
 * Tour Step Definitions for Al Ramrami Oil Trading
 *
 * Progressive tour system with prerequisites:
 * - Basics (required first)
 * - Dashboard, Purchase, Sales, Contracts, Settings (require Basics)
 * - Collections (requires Purchase)
 *
 * Each step has:
 * - element: CSS selector for target element
 * - popover: { title, description, side, align }
 * - route: (optional) navigate to this route before showing step
 */

export const TOUR_CONFIG = {
  // ============================================
  // BASICS TOUR - Introduction to PBM
  // ============================================
  basics: {
    id: 'basics',
    steps: [
      // Welcome
      {
        element: '[data-tour="welcome"]',
        popover: {
          title: 'Welcome to PBM!',
          titleAr: 'مرحباً بك في نظام إدارة البترول!',
          description: 'This guided tour will help you learn the basics of the Petroleum Business Management system. Let\'s get started!',
          descriptionAr: 'ستساعدك هذه الجولة الإرشادية على تعلم أساسيات نظام إدارة أعمال البترول. لنبدأ!',
          side: 'bottom',
          align: 'center'
        },
        route: '/dashboard'
      },
      // Company Info
      {
        element: '[data-tour="company-info"]',
        popover: {
          title: 'Company Information',
          titleAr: 'معلومات الشركة',
          description: 'This shows your current company. Al Ramrami Trading Enterprises is an oil trading business.',
          descriptionAr: 'يعرض هذا شركتك الحالية. شركة الرمرامي للتجارة هي شركة تجارة نفط.',
          side: 'bottom',
          align: 'start'
        }
      },
      // Main Navigation
      {
        element: '[data-tour="main-navigation"]',
        popover: {
          title: 'Main Navigation',
          titleAr: 'التنقل الرئيسي',
          description: 'Use this menu to navigate between different modules: Dashboard, Sales, Purchase, Inventory, and more.',
          descriptionAr: 'استخدم هذه القائمة للتنقل بين الوحدات المختلفة: لوحة التحكم، المبيعات، المشتريات، المخزون، والمزيد.',
          side: 'bottom',
          align: 'center'
        }
      },
      // User Menu
      {
        element: '[data-tour="user-menu"]',
        popover: {
          title: 'User Menu',
          titleAr: 'قائمة المستخدم',
          description: 'Access your profile, view notifications, and logout from here.',
          descriptionAr: 'الوصول إلى ملفك الشخصي، عرض الإشعارات، وتسجيل الخروج من هنا.',
          side: 'bottom',
          align: 'end'
        }
      },
      // Language Switcher
      {
        element: '[data-tour="language-switcher"]',
        popover: {
          title: 'Language Switcher',
          titleAr: 'تبديل اللغة',
          description: 'Switch between English and Arabic. The interface fully supports RTL layout.',
          descriptionAr: 'التبديل بين الإنجليزية والعربية. تدعم الواجهة التخطيط من اليمين إلى اليسار بالكامل.',
          side: 'bottom',
          align: 'end'
        }
      },
      // Theme Toggle
      {
        element: '[data-tour="theme-toggle"]',
        popover: {
          title: 'Theme Toggle',
          titleAr: 'تبديل السمة',
          description: 'Switch between light and dark mode based on your preference.',
          descriptionAr: 'التبديل بين الوضع الفاتح والداكن حسب تفضيلك.',
          side: 'bottom',
          align: 'end'
        }
      },
      // Notifications
      {
        element: '[data-tour="notifications-bell"]',
        popover: {
          title: 'Notifications',
          titleAr: 'الإشعارات',
          description: 'Stay updated with important alerts about pending tasks, approvals, and system updates.',
          descriptionAr: 'ابق على اطلاع بالتنبيهات المهمة حول المهام المعلقة والموافقات وتحديثات النظام.',
          side: 'bottom',
          align: 'end'
        }
      },
      // Primary Stats
      {
        element: '[data-tour="primary-stats"]',
        popover: {
          title: 'Key Metrics',
          titleAr: 'المقاييس الرئيسية',
          description: 'These cards show your most important business metrics: Collections, Purchase Orders, Invoices, and Pending Actions.',
          descriptionAr: 'تعرض هذه البطاقات أهم مقاييس عملك: التحصيلات، أوامر الشراء، الفواتير، والإجراءات المعلقة.',
          side: 'bottom',
          align: 'center'
        }
      },
      // Secondary Stats
      {
        element: '[data-tour="secondary-stats"]',
        popover: {
          title: 'Module Overview',
          titleAr: 'نظرة عامة على الوحدات',
          description: 'Quick access to all modules with their current status. Click any card to navigate directly.',
          descriptionAr: 'وصول سريع لجميع الوحدات مع حالتها الحالية. انقر على أي بطاقة للانتقال مباشرة.',
          side: 'top',
          align: 'center'
        }
      },
      // Pending Tasks
      {
        element: '[data-tour="pending-tasks"]',
        popover: {
          title: 'Your Tasks',
          titleAr: 'مهامك',
          description: 'View and manage your pending tasks organized by priority. High priority items appear first.',
          descriptionAr: 'عرض وإدارة مهامك المعلقة مرتبة حسب الأولوية. تظهر العناصر ذات الأولوية العالية أولاً.',
          side: 'right',
          align: 'start'
        }
      },
      // Activity Feed
      {
        element: '[data-tour="activity-feed"]',
        popover: {
          title: 'Recent Activity',
          titleAr: 'النشاط الأخير',
          description: 'Track recent actions across the system. Click any item to see details.',
          descriptionAr: 'تتبع الإجراءات الأخيرة عبر النظام. انقر على أي عنصر لرؤية التفاصيل.',
          side: 'left',
          align: 'start'
        }
      },
      // Help Menu
      {
        element: '[data-tour="help-menu"]',
        popover: {
          title: 'Help & Training',
          titleAr: 'المساعدة والتدريب',
          description: 'Access training tours anytime from here. You can restart tours or take advanced module-specific tours.',
          descriptionAr: 'الوصول إلى جولات التدريب في أي وقت من هنا. يمكنك إعادة تشغيل الجولات أو أخذ جولات متقدمة خاصة بالوحدات.',
          side: 'bottom',
          align: 'end'
        }
      },
      // Completion
      {
        element: '[data-tour="help-menu"]',
        popover: {
          title: 'Basics Complete!',
          titleAr: 'اكتمل التدريب الأساسي!',
          description: 'Great job! You\'ve completed the basics tour. You can now explore module-specific tours from the Help menu.',
          descriptionAr: 'عمل رائع! لقد أكملت الجولة الأساسية. يمكنك الآن استكشاف الجولات الخاصة بالوحدات من قائمة المساعدة.',
          side: 'bottom',
          align: 'end'
        }
      }
    ]
  },

  // ============================================
  // DASHBOARD TOUR - Deep Dive
  // ============================================
  dashboard: {
    id: 'dashboard',
    steps: [
      {
        element: '[data-tour="page-header"]',
        popover: {
          title: 'Dashboard Overview',
          titleAr: 'نظرة عامة على لوحة التحكم',
          description: 'The workflow dashboard gives you a complete view of your business operations.',
          descriptionAr: 'تمنحك لوحة سير العمل عرضًا كاملاً لعمليات عملك.',
          side: 'bottom',
          align: 'start'
        },
        route: '/dashboard'
      },
      {
        element: '[data-tour="notifications-panel"]',
        popover: {
          title: 'Notifications Panel',
          titleAr: 'لوحة الإشعارات',
          description: 'System notifications appear here. Click Show/Hide to expand or collapse.',
          descriptionAr: 'تظهر إشعارات النظام هنا. انقر على إظهار/إخفاء للتوسيع أو الطي.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '.stat-card:first-child',
        popover: {
          title: 'Collections Status',
          titleAr: 'حالة التحصيلات',
          description: 'Shows total collections and pending WCN (Waste Consignment Notes) that need finalization.',
          descriptionAr: 'يعرض إجمالي التحصيلات ومذكرات شحن النفايات المعلقة التي تحتاج إلى إنهاء.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.stat-card:nth-child(2)',
        popover: {
          title: 'Purchase Orders',
          titleAr: 'أوامر الشراء',
          description: 'Total purchase orders with auto-generated count from WCN finalization.',
          descriptionAr: 'إجمالي أوامر الشراء مع عدد الطلبات المولدة تلقائيًا من إنهاء WCN.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '.stat-card:nth-child(3)',
        popover: {
          title: 'Invoices',
          titleAr: 'الفواتير',
          description: 'Unpaid invoices and outstanding amount. Click to go to bills management.',
          descriptionAr: 'الفواتير غير المدفوعة والمبلغ المستحق. انقر للانتقال إلى إدارة الفواتير.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '.stat-card:nth-child(4)',
        popover: {
          title: 'Pending Actions',
          titleAr: 'الإجراءات المعلقة',
          description: 'Items requiring your attention. Red badge indicates high priority items.',
          descriptionAr: 'العناصر التي تتطلب انتباهك. يشير الشارة الحمراء إلى العناصر ذات الأولوية العالية.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '.task-section.high-priority',
        popover: {
          title: 'High Priority Tasks',
          titleAr: 'المهام ذات الأولوية العالية',
          description: 'Critical tasks that need immediate attention. Expand to see details and take action.',
          descriptionAr: 'المهام الحرجة التي تحتاج اهتمامًا فوريًا. وسّع لرؤية التفاصيل واتخاذ إجراء.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '.activity-list',
        popover: {
          title: 'Activity Timeline',
          titleAr: 'الجدول الزمني للنشاط',
          description: 'Real-time feed of actions across all modules. Each entry links to its source.',
          descriptionAr: 'تغذية فورية للإجراءات عبر جميع الوحدات. كل إدخال يرتبط بمصدره.',
          side: 'left',
          align: 'start'
        }
      }
    ]
  },

  // ============================================
  // PURCHASE TOUR - Complete Workflow
  // ============================================
  purchase: {
    id: 'purchase',
    steps: [
      {
        element: '[data-tour="workflow-stepper"]',
        popover: {
          title: 'Purchase Workflow',
          titleAr: 'سير عمل المشتريات',
          description: 'This shows the complete purchase process: Contracts → Callouts → WCN → PO → Expenses → Bills',
          descriptionAr: 'يعرض هذا عملية الشراء الكاملة: العقود ← النداءات ← WCN ← أمر الشراء ← المصروفات ← الفواتير',
          side: 'bottom',
          align: 'center'
        },
        route: '/purchase'
      },
      {
        element: '[data-tour="purchase-tabs"]',
        popover: {
          title: 'Purchase Tabs',
          titleAr: 'علامات تبويب المشتريات',
          description: 'Navigate between Collections, Purchase Orders, Bills, Expenses, and Vendors.',
          descriptionAr: 'التنقل بين التحصيلات، أوامر الشراء، الفواتير، المصروفات، والموردين.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.purchase-summary',
        popover: {
          title: 'Summary Cards',
          titleAr: 'بطاقات الملخص',
          description: 'Quick overview of total orders, pending items, order value, and expenses.',
          descriptionAr: 'نظرة عامة سريعة على إجمالي الطلبات، العناصر المعلقة، قيمة الطلبات، والمصروفات.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="po-table"]',
        popover: {
          title: 'Purchase Orders Table',
          titleAr: 'جدول أوامر الشراء',
          description: 'View all purchase orders. Use filters to search by status, vendor, or date.',
          descriptionAr: 'عرض جميع أوامر الشراء. استخدم الفلاتر للبحث حسب الحالة، المورد، أو التاريخ.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '.source-type-badge',
        popover: {
          title: 'Order Source',
          titleAr: 'مصدر الطلب',
          description: 'Shows if PO was auto-generated from WCN (wcn-auto) or manually created.',
          descriptionAr: 'يعرض إذا كان أمر الشراء تم إنشاؤه تلقائيًا من WCN أو يدويًا.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: '.table-actions',
        popover: {
          title: 'Order Actions',
          titleAr: 'إجراءات الطلب',
          description: 'View, Edit, Receive goods, Add expenses, Generate invoice, or view Amendments.',
          descriptionAr: 'عرض، تحرير، استلام البضائع، إضافة مصروفات، إنشاء فاتورة، أو عرض التعديلات.',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '[data-tour="bills-tab"]',
        popover: {
          title: 'Bills Management',
          titleAr: 'إدارة الفواتير',
          description: 'Company Bills (generated by you) vs Vendor Bills (received from suppliers).',
          descriptionAr: 'فواتير الشركة (المولدة بواسطتك) مقابل فواتير الموردين (المستلمة من الموردين).',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '.bills-summary-cards',
        popover: {
          title: 'Bill Statistics',
          titleAr: 'إحصائيات الفواتير',
          description: 'Track company bills, vendor bills, unpaid amounts, overdue, and balance due.',
          descriptionAr: 'تتبع فواتير الشركة، فواتير الموردين، المبالغ غير المدفوعة، المتأخرة، والرصيد المستحق.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="expenses-tab"]',
        popover: {
          title: 'Purchase Expenses',
          titleAr: 'مصروفات المشتريات',
          description: 'Track transportation, customs, and other costs linked to purchase orders.',
          descriptionAr: 'تتبع تكاليف النقل والجمارك والتكاليف الأخرى المرتبطة بأوامر الشراء.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '.receipt-column',
        popover: {
          title: 'Receipt Uploads',
          titleAr: 'رفع الإيصالات',
          description: 'Upload and view receipt photos for each expense. Click the camera icon to upload.',
          descriptionAr: 'رفع وعرض صور الإيصالات لكل مصروف. انقر على أيقونة الكاميرا للرفع.',
          side: 'left',
          align: 'center'
        }
      }
    ]
  },

  // ============================================
  // SALES TOUR
  // ============================================
  sales: {
    id: 'sales',
    steps: [
      {
        element: '.page-header',
        popover: {
          title: 'Sales Module',
          titleAr: 'وحدة المبيعات',
          description: 'Create and manage sales orders, generate invoices, and track deliveries.',
          descriptionAr: 'إنشاء وإدارة أوامر المبيعات، إنشاء الفواتير، وتتبع التسليمات.',
          side: 'bottom',
          align: 'start'
        },
        route: '/sales'
      },
      {
        element: '.tab-navigation',
        popover: {
          title: 'Sales & Invoices',
          titleAr: 'المبيعات والفواتير',
          description: 'Switch between Sales Orders and Invoices tabs.',
          descriptionAr: 'التبديل بين علامتي تبويب أوامر المبيعات والفواتير.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.summary-cards',
        popover: {
          title: 'Sales Summary',
          titleAr: 'ملخص المبيعات',
          description: 'Daily sales, total orders, and pending deliveries at a glance.',
          descriptionAr: 'المبيعات اليومية، إجمالي الطلبات، والتسليمات المعلقة في لمحة.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '.filter-buttons',
        popover: {
          title: 'Filter Orders',
          titleAr: 'تصفية الطلبات',
          description: 'Filter by status, customer, or date range to find specific orders.',
          descriptionAr: 'التصفية حسب الحالة، العميل، أو نطاق التاريخ للعثور على طلبات محددة.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '.sales-orders-table',
        popover: {
          title: 'Orders Table',
          titleAr: 'جدول الطلبات',
          description: 'All sales orders with customer, items, amount, and invoice status.',
          descriptionAr: 'جميع أوامر المبيعات مع العميل، العناصر، المبلغ، وحالة الفاتورة.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '.btn-primary',
        popover: {
          title: 'Create Order',
          titleAr: 'إنشاء طلب',
          description: 'Click to create a new sales order. Select customer, add items, and save.',
          descriptionAr: 'انقر لإنشاء أمر مبيعات جديد. حدد العميل، أضف العناصر، واحفظ.',
          side: 'left',
          align: 'center'
        }
      }
    ]
  },

  // ============================================
  // COLLECTIONS TOUR
  // ============================================
  collections: {
    id: 'collections',
    steps: [
      {
        element: '.collections-header',
        popover: {
          title: 'Collections Module',
          titleAr: 'وحدة التحصيلات',
          description: 'Manage material collections from suppliers with the new workflow-driven interface.',
          descriptionAr: 'إدارة تحصيلات المواد من الموردين مع واجهة سير العمل الجديدة.',
          side: 'bottom',
          align: 'start'
        },
        route: '/purchase?tab=collections'
      },
      {
        element: '.workflow-progress-bar',
        popover: {
          title: 'Workflow Progress Bar',
          titleAr: 'شريط تقدم سير العمل',
          description: 'Click any stage to filter: Scheduled (yellow), In Progress (blue), Completed (green), Finalized (indigo). Each shows a count badge.',
          descriptionAr: 'انقر على أي مرحلة للتصفية: مجدول (أصفر)، قيد التقدم (أزرق)، مكتمل (أخضر)، منتهي (نيلي). كل مرحلة تعرض عدد العناصر.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '.workflow-stage-all',
        popover: {
          title: 'Show All Collections',
          titleAr: 'عرض جميع التحصيلات',
          description: 'Click "All" to reset filters and see all collections regardless of status.',
          descriptionAr: 'انقر "الكل" لإعادة ضبط الفلاتر وعرض جميع التحصيلات بغض النظر عن الحالة.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="callout-manager"]',
        popover: {
          title: 'Collection Orders Table',
          titleAr: 'جدول أوامر التحصيل',
          description: 'View collections with type badges, status, and icon-only action buttons. Hover on buttons for tooltips.',
          descriptionAr: 'عرض التحصيلات مع شارات النوع والحالة وأزرار الإجراءات. مرر الماوس على الأزرار لرؤية التلميحات.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="wcn-section"]',
        popover: {
          title: 'WCN Finalization',
          titleAr: 'إنهاء WCN',
          description: 'Completed collections show "Finalize WCN" button. This confirms quantities and auto-generates a Purchase Order.',
          descriptionAr: 'التحصيلات المكتملة تعرض زر "إنهاء WCN". هذا يؤكد الكميات وينشئ أمر شراء تلقائيًا.',
          side: 'bottom',
          align: 'center'
        }
      }
    ]
  },

  // ============================================
  // CONTRACTS TOUR
  // ============================================
  contracts: {
    id: 'contracts',
    steps: [
      {
        element: '.contract-header',
        popover: {
          title: 'Contract Management',
          titleAr: 'إدارة العقود',
          description: 'Create and manage supplier contracts with location-specific material rates.',
          descriptionAr: 'إنشاء وإدارة عقود الموردين مع أسعار المواد الخاصة بالموقع.',
          side: 'bottom',
          align: 'start'
        },
        route: '/contracts'
      },
      {
        element: '.contracts-table',
        popover: {
          title: 'Contracts List',
          titleAr: 'قائمة العقود',
          description: 'View all contracts with supplier, dates, status, and type.',
          descriptionAr: 'عرض جميع العقود مع المورد، التواريخ، الحالة، والنوع.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '.status-badge',
        popover: {
          title: 'Contract Status',
          titleAr: 'حالة العقد',
          description: 'Status indicators: Draft, Active, Expired, or Terminated.',
          descriptionAr: 'مؤشرات الحالة: مسودة، نشط، منتهي، أو ملغى.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: '.btn-primary',
        popover: {
          title: 'Create Contract',
          titleAr: 'إنشاء عقد',
          description: 'Create a new contract. Define supplier, locations, materials, and pricing.',
          descriptionAr: 'إنشاء عقد جديد. تحديد المورد، المواقع، المواد، والتسعير.',
          side: 'left',
          align: 'center'
        }
      }
    ]
  },

  // ============================================
  // SETTINGS TOUR
  // ============================================
  settings: {
    id: 'settings',
    steps: [
      {
        element: '.settings-tabs',
        popover: {
          title: 'Settings',
          titleAr: 'الإعدادات',
          description: 'Configure your preferences: Language, Date format, VAT rate, and more.',
          descriptionAr: 'تهيئة تفضيلاتك: اللغة، تنسيق التاريخ، نسبة ضريبة القيمة المضافة، والمزيد.',
          side: 'right',
          align: 'start'
        },
        route: '/settings'
      },
      {
        element: '[data-tour="language-settings"]',
        popover: {
          title: 'Language & Locale',
          titleAr: 'اللغة والإعدادات المحلية',
          description: 'Change language (English/Arabic) and regional date/time formats.',
          descriptionAr: 'تغيير اللغة (الإنجليزية/العربية) وتنسيقات التاريخ/الوقت الإقليمية.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="vat-settings"]',
        popover: {
          title: 'VAT Settings',
          titleAr: 'إعدادات ضريبة القيمة المضافة',
          description: 'Configure the VAT percentage applied to invoices.',
          descriptionAr: 'تهيئة نسبة ضريبة القيمة المضافة المطبقة على الفواتير.',
          side: 'right',
          align: 'center'
        }
      },
      {
        element: '[data-tour="branch-management"]',
        popover: {
          title: 'Branch Management',
          titleAr: 'إدارة الفروع',
          description: 'Add and manage company branches with contact information.',
          descriptionAr: 'إضافة وإدارة فروع الشركة مع معلومات الاتصال.',
          side: 'top',
          align: 'center'
        }
      }
    ]
  }
};

// ============================================
// WORKFLOW GUIDES - Context-Aware Educational Guides
// ============================================
// These guides teach users HOW to complete business processes.
// Steps have context requirements that auto-advance based on user actions.
// Tours react to WHERE the user is - when user opens a modal, relevant guidance appears.

export const WORKFLOW_GUIDES = {
  // ========================================
  // PURCHASE WORKFLOWS
  // ========================================

  /**
   * How to Create a Purchase Order
   *
   * Educational workflow guide that teaches the complete PO creation process.
   * Follows user through page → modal → form completion.
   */
  'create-purchase-order': {
    id: 'create-purchase-order',
    name: 'How to Create a Purchase Order',
    nameAr: 'كيفية إنشاء أمر شراء',
    description: 'Learn the complete PO creation process step-by-step',
    descriptionAr: 'تعلم عملية إنشاء أمر الشراء خطوة بخطوة',
    category: 'purchase',
    roles: ['PURCHASE_STAFF', 'MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'],
    estimatedTime: '5 min',
    steps: [
      // Step 1: Navigate to Purchase module
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="purchase-orders-tab"]',
        popover: {
          title: 'Purchase Orders Tab',
          titleAr: 'علامة تبويب أوامر الشراء',
          description: 'This tab shows all your purchase orders. You can view existing orders, track their status, and create new ones.',
          descriptionAr: 'تعرض هذه العلامة جميع أوامر الشراء. يمكنك عرض الطلبات الحالية وتتبع حالتها وإنشاء طلبات جديدة.',
          side: 'bottom',
          align: 'start'
        },
        route: '/purchase?tab=orders'
      },
      // Step 2: Click New PO button
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="new-po-button"]',
        popover: {
          title: 'Create New Purchase Order',
          titleAr: 'إنشاء أمر شراء جديد',
          description: 'Click this button to open the PO creation form. The form will guide you through selecting a supplier, adding materials, and setting terms.',
          descriptionAr: 'انقر هذا الزر لفتح نموذج إنشاء أمر الشراء. سيرشدك النموذج خلال اختيار المورد وإضافة المواد وتعيين الشروط.',
          side: 'bottom',
          align: 'center'
        },
        waitForAction: 'click' // Tour waits for user to click
      },
      // Step 3: Inside PO Modal - Supplier Selection
      {
        context: { requireModal: 'PurchaseOrderForm' },
        element: '[data-tour="po-supplier-select"]',
        popover: {
          title: 'Step 1: Select Supplier',
          titleAr: 'الخطوة 1: اختر المورد',
          description: 'Choose the supplier you are purchasing from. This determines available contracts, rates, and payment terms.',
          descriptionAr: 'اختر المورد الذي تشتري منه. هذا يحدد العقود المتاحة والأسعار وشروط الدفع.',
          side: 'right',
          align: 'start'
        }
      },
      // Step 4: Branch Selection (shows after supplier selected)
      {
        context: {
          requireModal: 'PurchaseOrderForm',
          requireFormState: { hasSupplier: true }
        },
        element: '[data-tour="po-branch-select"]',
        popover: {
          title: 'Step 2: Select Receiving Branch',
          titleAr: 'الخطوة 2: اختر فرع الاستلام',
          description: 'Select which company branch will receive the materials. This affects inventory tracking and delivery logistics.',
          descriptionAr: 'حدد فرع الشركة الذي سيستلم المواد. هذا يؤثر على تتبع المخزون والخدمات اللوجستية للتسليم.',
          side: 'right',
          align: 'start'
        }
      },
      // Step 5: Add Items section
      {
        context: {
          requireModal: 'PurchaseOrderForm',
          requireFormState: { hasSupplier: true, hasBranch: true }
        },
        element: '[data-tour="po-items-section"]',
        popover: {
          title: 'Step 3: Add Materials',
          titleAr: 'الخطوة 3: أضف المواد',
          description: 'Add the materials you want to purchase. Select a material, enter quantity, and set the rate. If there\'s an active contract, rates may auto-fill.',
          descriptionAr: 'أضف المواد التي تريد شراءها. حدد مادة وأدخل الكمية وحدد السعر. إذا كان هناك عقد نشط، قد يتم ملء الأسعار تلقائيًا.',
          side: 'top',
          align: 'center'
        }
      },
      // Step 6: Review items
      {
        context: {
          requireModal: 'PurchaseOrderForm',
          requireFormState: { hasSupplier: true, hasBranch: true, itemCount: 1 }
        },
        element: '[data-tour="po-items-table"]',
        popover: {
          title: 'Review Your Items',
          titleAr: 'راجع العناصر',
          description: 'Check the materials, quantities, and rates. The subtotal calculates automatically. You can edit or remove items if needed.',
          descriptionAr: 'تحقق من المواد والكميات والأسعار. يتم حساب المجموع الفرعي تلقائيًا. يمكنك تعديل أو إزالة العناصر إذا لزم الأمر.',
          side: 'top',
          align: 'center'
        }
      },
      // Step 7: Payment Terms
      {
        context: {
          requireModal: 'PurchaseOrderForm',
          requireFormState: { completeItemCount: 1 }
        },
        element: '[data-tour="po-terms-select"]',
        popover: {
          title: 'Step 4: Payment Terms',
          titleAr: 'الخطوة 4: شروط الدفع',
          description: 'Select payment terms (e.g., Net 30, Net 60). This defines when payment is due after delivery.',
          descriptionAr: 'اختر شروط الدفع (مثل صافي 30، صافي 60). هذا يحدد موعد استحقاق الدفع بعد التسليم.',
          side: 'right',
          align: 'start'
        }
      },
      // Step 8: Notes (optional)
      {
        context: {
          requireModal: 'PurchaseOrderForm',
          requireFormState: { completeItemCount: 1 }
        },
        element: '[data-tour="po-notes"]',
        popover: {
          title: 'Add Notes (Optional)',
          titleAr: 'أضف ملاحظات (اختياري)',
          description: 'Add any special instructions or notes for this order. These will appear on the printed PO.',
          descriptionAr: 'أضف أي تعليمات أو ملاحظات خاصة لهذا الطلب. ستظهر هذه على أمر الشراء المطبوع.',
          side: 'top',
          align: 'start'
        }
      },
      // Step 9: Submit button
      {
        context: {
          requireModal: 'PurchaseOrderForm',
          requireFormState: { completeItemCount: 1 }
        },
        element: '[data-tour="po-submit-button"]',
        popover: {
          title: 'Create Purchase Order',
          titleAr: 'إنشاء أمر الشراء',
          description: 'Click "Create Purchase Order" to save. The order will be created in "Draft" status. You can then send it to the supplier or convert it later.',
          descriptionAr: 'انقر "إنشاء أمر الشراء" للحفظ. سيتم إنشاء الطلب بحالة "مسودة". يمكنك بعد ذلك إرساله إلى المورد أو تحويله لاحقًا.',
          side: 'top',
          align: 'end'
        }
      },
      // Completion step (back on page after modal closes)
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="po-table"]',
        popover: {
          title: 'Purchase Order Created! 🎉',
          titleAr: 'تم إنشاء أمر الشراء! 🎉',
          description: 'Your new purchase order appears here. Next steps: Send to supplier, receive goods when delivered, then create vendor bill for payment.',
          descriptionAr: 'يظهر أمر الشراء الجديد هنا. الخطوات التالية: أرسل إلى المورد، استلم البضائع عند التسليم، ثم أنشئ فاتورة المورد للدفع.',
          side: 'top',
          align: 'center'
        }
      }
    ]
  },

  /**
   * Collection to WCN Workflow
   *
   * Teaches the complete collection workflow from callout to WCN finalization.
   */
  'collection-to-wcn': {
    id: 'collection-to-wcn',
    name: 'Complete Collection to WCN',
    nameAr: 'إتمام التحصيل إلى WCN',
    description: 'From scheduled collection to WCN finalization and auto-PO',
    descriptionAr: 'من التحصيل المجدول إلى إنهاء WCN وإنشاء أمر الشراء التلقائي',
    category: 'purchase',
    roles: ['PURCHASE_STAFF', 'MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'],
    estimatedTime: '8 min',
    steps: [
      // Step 1: Navigate to Collections tab
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="collections-tab"]',
        popover: {
          title: 'Collections Tab',
          titleAr: 'علامة التحصيلات',
          description: 'Collections track materials picked up from suppliers under contracts. This is the starting point for contract-based purchases.',
          descriptionAr: 'تتبع التحصيلات المواد المستلمة من الموردين بموجب العقود. هذه هي نقطة البداية للمشتريات القائمة على العقود.',
          side: 'bottom',
          align: 'start'
        },
        route: '/purchase?tab=collections'
      },
      // Step 2: Understand the Workflow Progress Bar
      {
        context: { requirePage: '/purchase' },
        element: '.workflow-progress-bar',
        popover: {
          title: 'Workflow Progress Bar',
          titleAr: 'شريط تقدم سير العمل',
          description: 'Collections flow through four stages: Scheduled (yellow) → In Progress (blue) → Completed (green) → Finalized (indigo). Click any stage to filter the table.',
          descriptionAr: 'تمر التحصيلات عبر أربع مراحل: مجدول (أصفر) ← قيد التقدم (أزرق) ← مكتمل (أخضر) ← منتهي (نيلي). انقر على أي مرحلة لتصفية الجدول.',
          side: 'bottom',
          align: 'center'
        }
      },
      // Step 3: Scheduled Collections
      {
        context: { requirePage: '/purchase' },
        element: '.workflow-stage-yellow',
        popover: {
          title: 'Step 1: Scheduled Stage',
          titleAr: 'الخطوة 1: مرحلة المجدول',
          description: 'Click the yellow Scheduled stage to see collections awaiting driver assignment or dispatch. Use "Assign Driver" icon to assign a driver.',
          descriptionAr: 'انقر على مرحلة المجدول الصفراء لرؤية التحصيلات التي تنتظر تعيين سائق. استخدم أيقونة "تعيين سائق" لتعيين سائق.',
          side: 'bottom',
          align: 'start'
        }
      },
      // Step 4: In Progress Collections
      {
        context: { requirePage: '/purchase' },
        element: '.workflow-stage-blue',
        popover: {
          title: 'Step 2: In Progress Stage',
          titleAr: 'الخطوة 2: مرحلة قيد التقدم',
          description: 'Blue stage shows active collections - In Transit or Collecting. Use the primary action button to update status as the driver progresses.',
          descriptionAr: 'المرحلة الزرقاء تعرض التحصيلات النشطة - في الطريق أو جاري التحصيل. استخدم زر الإجراء الأساسي لتحديث الحالة.',
          side: 'bottom',
          align: 'center'
        }
      },
      // Step 5: Enter collected quantities
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="collection-items-table"]',
        popover: {
          title: 'Record Collected Quantities',
          titleAr: 'سجل الكميات المجمعة',
          description: 'When the driver returns, enter the actual quantities collected. This may differ from the callout estimate.',
          descriptionAr: 'عند عودة السائق، أدخل الكميات الفعلية المجمعة. قد تختلف عن تقدير النداء.',
          side: 'top',
          align: 'center'
        }
      },
      // Step 6: Add collection expenses
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="collection-expenses"]',
        popover: {
          title: 'Add Collection Expenses',
          titleAr: 'أضف مصاريف التحصيل',
          description: 'Record any expenses incurred during collection: fuel, tolls, labor, etc. These will be included in total purchase cost.',
          descriptionAr: 'سجل أي مصاريف تكبدتها أثناء التحصيل: الوقود، الرسوم، العمالة، إلخ. سيتم تضمينها في إجمالي تكلفة الشراء.',
          side: 'top',
          align: 'start'
        }
      },
      // Step 7: Finalize WCN button
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="finalize-wcn-button"]',
        popover: {
          title: 'Step 3: Finalize WCN',
          titleAr: 'الخطوة 3: إنهاء WCN',
          description: 'WCN (Waste Consignment Note) is the official record. Click "Finalize WCN" to confirm quantities and generate the purchase order.',
          descriptionAr: 'WCN (مذكرة شحن النفايات) هي السجل الرسمي. انقر "إنهاء WCN" لتأكيد الكميات وإنشاء أمر الشراء.',
          side: 'left',
          align: 'center'
        },
        waitForAction: 'click'
      },
      // Step 8: WCN Modal - Review summary
      {
        context: { requireModal: 'WCNFinalizationModal' },
        element: '[data-tour="wcn-summary"]',
        popover: {
          title: 'Review WCN Summary',
          titleAr: 'راجع ملخص WCN',
          description: 'Review the collection details: supplier, location, materials, quantities, and rates. Verify everything is correct.',
          descriptionAr: 'راجع تفاصيل التحصيل: المورد، الموقع، المواد، الكميات، والأسعار. تحقق من صحة كل شيء.',
          side: 'left',
          align: 'start'
        }
      },
      // Step 9: Composite material preview
      {
        context: { requireModal: 'WCNFinalizationModal' },
        element: '[data-tour="wcn-composite-preview"]',
        popover: {
          title: 'Composite Materials',
          titleAr: 'المواد المركبة',
          description: 'Some materials (like "Engine Oil with Drums") are composites. They\'ll be auto-split into components for inventory.',
          descriptionAr: 'بعض المواد (مثل "زيت المحرك مع البراميل") مركبة. سيتم تقسيمها تلقائيًا إلى مكونات للمخزون.',
          side: 'right',
          align: 'center'
        }
      },
      // Step 10: Confirm WCN
      {
        context: { requireModal: 'WCNFinalizationModal' },
        element: '[data-tour="wcn-confirm-button"]',
        popover: {
          title: 'Confirm & Generate PO',
          titleAr: 'تأكيد وإنشاء أمر الشراء',
          description: 'Click to finalize. This will: (1) Create WCN record, (2) Update inventory, (3) Auto-generate Purchase Order.',
          descriptionAr: 'انقر للإنهاء. سيقوم هذا بـ: (1) إنشاء سجل WCN، (2) تحديث المخزون، (3) إنشاء أمر شراء تلقائي.',
          side: 'top',
          align: 'end'
        }
      },
      // Completion
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="po-table"]',
        popover: {
          title: 'Collection Complete! 🎉',
          titleAr: 'اكتمل التحصيل! 🎉',
          description: 'The auto-generated PO now appears in Purchase Orders. It\'s marked with "WCN Auto" source. Next: Create vendor bill when supplier invoices.',
          descriptionAr: 'يظهر أمر الشراء المُنشأ تلقائيًا الآن في أوامر الشراء. تم تمييزه بمصدر "WCN تلقائي". التالي: أنشئ فاتورة المورد عند إصدار فاتورة المورد.',
          side: 'top',
          align: 'center'
        }
      }
    ]
  },

  // ========================================
  // SALES WORKFLOWS
  // ========================================

  /**
   * How to Create a Sales Order
   *
   * Educational guide for sales order creation with contract rate application.
   */
  'create-sales-order': {
    id: 'create-sales-order',
    name: 'How to Create a Sales Order',
    nameAr: 'كيفية إنشاء أمر مبيعات',
    description: 'Create sales orders with automatic contract rate application',
    descriptionAr: 'إنشاء أوامر المبيعات مع تطبيق أسعار العقود التلقائي',
    category: 'sales',
    roles: ['SALES_STAFF', 'MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'],
    estimatedTime: '4 min',
    steps: [
      // Step 1: Navigate to Sales
      {
        context: { requirePage: '/sales' },
        element: '[data-tour="sales-orders-tab"]',
        popover: {
          title: 'Sales Orders',
          titleAr: 'أوامر المبيعات',
          description: 'This is where you manage all sales orders. You can view, create, and track orders to customers.',
          descriptionAr: 'هنا تدير جميع أوامر المبيعات. يمكنك عرض وإنشاء وتتبع الطلبات للعملاء.',
          side: 'bottom',
          align: 'start'
        },
        route: '/sales'
      },
      // Step 2: New order button
      {
        context: { requirePage: '/sales' },
        element: '[data-tour="new-sales-order-button"]',
        popover: {
          title: 'Create New Sales Order',
          titleAr: 'إنشاء أمر مبيعات جديد',
          description: 'Click to open the sales order form. You\'ll select a customer, add materials, and the system will apply contract rates automatically.',
          descriptionAr: 'انقر لفتح نموذج أمر المبيعات. ستختار عميلًا وتضيف مواد، وسيطبق النظام أسعار العقود تلقائيًا.',
          side: 'bottom',
          align: 'center'
        },
        waitForAction: 'click'
      },
      // Step 3: Customer selection (in modal)
      {
        context: { requireModal: 'SalesOrderForm' },
        element: '[data-tour="so-customer-select"]',
        popover: {
          title: 'Step 1: Select Customer',
          titleAr: 'الخطوة 1: اختر العميل',
          description: 'Choose the customer for this order. If they have an active contract, their negotiated rates will apply to materials.',
          descriptionAr: 'اختر العميل لهذا الطلب. إذا كان لديهم عقد نشط، ستنطبق أسعارهم المتفاوض عليها على المواد.',
          side: 'right',
          align: 'start'
        }
      },
      // Step 4: Add items
      {
        context: {
          requireModal: 'SalesOrderForm',
          requireFormState: { hasCustomer: true }
        },
        element: '[data-tour="so-items-section"]',
        popover: {
          title: 'Step 2: Add Materials',
          titleAr: 'الخطوة 2: أضف المواد',
          description: 'Add materials to the order. When you select a material, the system checks for contract rates and displays any savings.',
          descriptionAr: 'أضف المواد للطلب. عند اختيار مادة، يتحقق النظام من أسعار العقد ويعرض أي وفورات.',
          side: 'top',
          align: 'center'
        }
      },
      // Step 5: Contract rate display
      {
        context: {
          requireModal: 'SalesOrderForm',
          requireFormState: { hasCustomer: true, itemCount: 1 }
        },
        element: '[data-tour="so-contract-rate-display"]',
        popover: {
          title: 'Contract Rate Applied',
          titleAr: 'تم تطبيق سعر العقد',
          description: 'Green indicates contract rate is applied. You\'ll see the savings compared to market rate. Fixed rates protect customers from price increases.',
          descriptionAr: 'الأخضر يشير إلى تطبيق سعر العقد. سترى الوفورات مقارنة بسعر السوق. الأسعار الثابتة تحمي العملاء من زيادات الأسعار.',
          side: 'right',
          align: 'center'
        }
      },
      // Step 6: Submit
      {
        context: {
          requireModal: 'SalesOrderForm',
          requireFormState: { completeItemCount: 1 }
        },
        element: '[data-tour="so-submit-button"]',
        popover: {
          title: 'Create Sales Order',
          titleAr: 'إنشاء أمر المبيعات',
          description: 'Click to create the order. It will be in "Pending" status until you confirm delivery and generate an invoice.',
          descriptionAr: 'انقر لإنشاء الطلب. سيكون بحالة "معلق" حتى تؤكد التسليم وتنشئ فاتورة.',
          side: 'top',
          align: 'end'
        }
      },
      // Completion
      {
        context: { requirePage: '/sales' },
        element: '[data-tour="sales-orders-table"]',
        popover: {
          title: 'Sales Order Created! 🎉',
          titleAr: 'تم إنشاء أمر المبيعات! 🎉',
          description: 'Your order appears here. Next steps: Prepare for delivery, confirm delivery, then generate invoice for payment.',
          descriptionAr: 'يظهر طلبك هنا. الخطوات التالية: التحضير للتسليم، تأكيد التسليم، ثم إنشاء فاتورة للدفع.',
          side: 'top',
          align: 'center'
        }
      }
    ]
  },

  // ========================================
  // ADMIN/MANAGER WORKFLOWS
  // ========================================

  /**
   * Approve Pending Expenses
   *
   * Manager workflow for expense approval.
   */
  'approve-expenses': {
    id: 'approve-expenses',
    name: 'Approve Pending Expenses',
    nameAr: 'الموافقة على المصاريف المعلقة',
    description: 'Review and approve staff expense submissions',
    descriptionAr: 'مراجعة والموافقة على مصاريف الموظفين',
    category: 'admin',
    roles: ['MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'],
    estimatedTime: '3 min',
    steps: [
      // Step 1: Navigate to Expenses
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="expenses-tab"]',
        popover: {
          title: 'Expenses Tab',
          titleAr: 'علامة المصاريف',
          description: 'All purchase-related expenses appear here. As a manager, you can approve or reject pending expenses.',
          descriptionAr: 'تظهر جميع المصاريف المتعلقة بالمشتريات هنا. كمدير، يمكنك الموافقة أو رفض المصاريف المعلقة.',
          side: 'bottom',
          align: 'center'
        },
        route: '/purchase?tab=expenses'
      },
      // Step 2: Filter pending
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="expense-status-filter"]',
        popover: {
          title: 'Filter by Status',
          titleAr: 'تصفية حسب الحالة',
          description: 'Filter to "Pending" to see expenses awaiting your approval. You can also filter by date or expense type.',
          descriptionAr: 'اختر "معلق" لرؤية المصاريف التي تنتظر موافقتك. يمكنك أيضًا التصفية حسب التاريخ أو نوع المصروف.',
          side: 'bottom',
          align: 'start'
        }
      },
      // Step 3: Review expense details
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="expense-row"]',
        popover: {
          title: 'Review Expense Details',
          titleAr: 'راجع تفاصيل المصروف',
          description: 'Check the expense type, amount, PO reference, and any attached receipts before approving.',
          descriptionAr: 'تحقق من نوع المصروف والمبلغ ومرجع أمر الشراء وأي إيصالات مرفقة قبل الموافقة.',
          side: 'top',
          align: 'center'
        }
      },
      // Step 4: View receipt
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="expense-receipt"]',
        popover: {
          title: 'Check Receipt',
          titleAr: 'تحقق من الإيصال',
          description: 'Click the receipt icon to view the uploaded receipt image. Verify it matches the expense claim.',
          descriptionAr: 'انقر على أيقونة الإيصال لعرض صورة الإيصال المرفوعة. تحقق من تطابقها مع طلب المصروف.',
          side: 'left',
          align: 'center'
        }
      },
      // Step 5: Approve/Reject actions
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="expense-actions"]',
        popover: {
          title: 'Approve or Reject',
          titleAr: 'موافقة أو رفض',
          description: 'Click ✓ to approve or ✗ to reject. When rejecting, you\'ll need to provide a reason.',
          descriptionAr: 'انقر ✓ للموافقة أو ✗ للرفض. عند الرفض، ستحتاج إلى تقديم سبب.',
          side: 'left',
          align: 'center'
        }
      },
      // Completion
      {
        context: { requirePage: '/purchase' },
        element: '[data-tour="expenses-tab"]',
        popover: {
          title: 'Approval Complete!',
          titleAr: 'اكتملت الموافقة!',
          description: 'Approved expenses are added to the PO cost. Rejected expenses notify the staff member to revise and resubmit.',
          descriptionAr: 'تضاف المصاريف الموافق عليها إلى تكلفة أمر الشراء. تُعلم المصاريف المرفوضة الموظف للمراجعة وإعادة الإرسال.',
          side: 'bottom',
          align: 'center'
        }
      }
    ]
  },

  /**
   * Create Supplier Contract
   *
   * Admin workflow for setting up supplier contracts with location-specific rates.
   */
  'setup-contract': {
    id: 'setup-contract',
    name: 'Create Supplier Contract',
    nameAr: 'إنشاء عقد مورد',
    description: 'Set up contracts with location-specific material rates',
    descriptionAr: 'إعداد العقود مع أسعار المواد الخاصة بالموقع',
    category: 'admin',
    roles: ['MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'],
    estimatedTime: '6 min',
    steps: [
      // Step 1: Navigate to Contracts
      {
        context: { requirePage: '/contracts' },
        element: '[data-tour="contracts-header"]',
        popover: {
          title: 'Contracts Module',
          titleAr: 'وحدة العقود',
          description: 'Contracts define your agreements with suppliers: which locations, what materials, at what rates.',
          descriptionAr: 'تحدد العقود اتفاقياتك مع الموردين: أي مواقع، أي مواد، بأي أسعار.',
          side: 'bottom',
          align: 'start'
        },
        route: '/contracts'
      },
      // Step 2: New contract button
      {
        context: { requirePage: '/contracts' },
        element: '[data-tour="new-contract-button"]',
        popover: {
          title: 'Create New Contract',
          titleAr: 'إنشاء عقد جديد',
          description: 'Click to start creating a new supplier contract. You\'ll define supplier, locations, and material rates.',
          descriptionAr: 'انقر لبدء إنشاء عقد مورد جديد. ستحدد المورد والمواقع وأسعار المواد.',
          side: 'bottom',
          align: 'center'
        },
        waitForAction: 'click'
      },
      // Step 3: Contract form - Supplier
      {
        context: { requireModal: 'ContractFormModal' },
        element: '[data-tour="contract-supplier-select"]',
        popover: {
          title: 'Step 1: Select Supplier',
          titleAr: 'الخطوة 1: اختر المورد',
          description: 'Choose the supplier for this contract. Their locations will be loaded for you to configure rates.',
          descriptionAr: 'اختر المورد لهذا العقد. سيتم تحميل مواقعهم لتتمكن من تكوين الأسعار.',
          side: 'right',
          align: 'start'
        }
      },
      // Step 4: Contract dates
      {
        context: {
          requireModal: 'ContractFormModal',
          requireFormState: { hasSupplier: true }
        },
        element: '[data-tour="contract-dates"]',
        popover: {
          title: 'Step 2: Contract Period',
          titleAr: 'الخطوة 2: فترة العقد',
          description: 'Set start and end dates. Rates are only active during this period. You\'ll get alerts before expiry.',
          descriptionAr: 'حدد تواريخ البدء والانتهاء. الأسعار نشطة فقط خلال هذه الفترة. ستتلقى تنبيهات قبل انتهاء الصلاحية.',
          side: 'right',
          align: 'center'
        }
      },
      // Step 5: Location rates table
      {
        context: {
          requireModal: 'ContractFormModal',
          requireFormState: { hasSupplier: true }
        },
        element: '[data-tour="contract-locations-table"]',
        popover: {
          title: 'Step 3: Location Material Rates',
          titleAr: 'الخطوة 3: أسعار المواد بالموقع',
          description: 'Each location can have different rates. Add materials and set their rates, rate types, and quantities.',
          descriptionAr: 'يمكن أن يكون لكل موقع أسعار مختلفة. أضف المواد وحدد أسعارها وأنواعها وكمياتها.',
          side: 'top',
          align: 'center'
        }
      },
      // Step 6: Rate types
      {
        context: {
          requireModal: 'ContractFormModal',
          requireFormState: { hasSupplier: true }
        },
        element: '[data-tour="contract-rate-type"]',
        popover: {
          title: 'Rate Types',
          titleAr: 'أنواع الأسعار',
          description: 'Fixed Rate: locked price. Discount %: off market price. Minimum Price: customer pays lower of contract or market.',
          descriptionAr: 'سعر ثابت: سعر مقفل. نسبة خصم: خصم من سعر السوق. الحد الأدنى للسعر: العميل يدفع الأقل من العقد أو السوق.',
          side: 'right',
          align: 'center'
        }
      },
      // Step 7: Save contract
      {
        context: { requireModal: 'ContractFormModal' },
        element: '[data-tour="contract-submit-button"]',
        popover: {
          title: 'Save Contract',
          titleAr: 'حفظ العقد',
          description: 'Click to save. Contract starts in "Draft" status. Activate it when ready to apply the rates.',
          descriptionAr: 'انقر للحفظ. يبدأ العقد بحالة "مسودة". قم بتفعيله عندما تكون مستعدًا لتطبيق الأسعار.',
          side: 'top',
          align: 'end'
        }
      },
      // Completion
      {
        context: { requirePage: '/contracts' },
        element: '[data-tour="contracts-table"]',
        popover: {
          title: 'Contract Created! 🎉',
          titleAr: 'تم إنشاء العقد! 🎉',
          description: 'Your contract appears here. Change status to "Active" to start using contract rates for callouts and collections.',
          descriptionAr: 'يظهر عقدك هنا. غيّر الحالة إلى "نشط" لبدء استخدام أسعار العقد للنداءات والتحصيلات.',
          side: 'top',
          align: 'center'
        }
      }
    ]
  }
};

/**
 * Get workflow guides filtered by user role
 */
export const getWorkflowGuidesByRole = (userRole) => {
  return Object.values(WORKFLOW_GUIDES).filter(guide =>
    guide.roles.includes(userRole)
  );
};

/**
 * Get workflow guides grouped by category
 */
export const getWorkflowGuidesByCategory = (userRole) => {
  const guides = getWorkflowGuidesByRole(userRole);
  return {
    purchase: guides.filter(g => g.category === 'purchase'),
    sales: guides.filter(g => g.category === 'sales'),
    admin: guides.filter(g => g.category === 'admin')
  };
};

/**
 * Get localized step from workflow guide
 */
export const getLocalizedWorkflowStep = (step, language = 'en') => {
  const isArabic = language === 'ar';
  return {
    ...step,
    popover: {
      title: isArabic && step.popover.titleAr ? step.popover.titleAr : step.popover.title,
      description: isArabic && step.popover.descriptionAr ? step.popover.descriptionAr : step.popover.description,
      side: step.popover.side,
      align: step.popover.align
    }
  };
};

// Helper function to get localized step content
// IMPORTANT: Preserves all step properties including waitForAction, context, etc.
export const getLocalizedStep = (step, language = 'en') => {
  const isArabic = language === 'ar';
  return {
    ...step, // Preserve ALL properties (waitForAction, context, route, etc.)
    popover: {
      title: isArabic && step.popover.titleAr ? step.popover.titleAr : step.popover.title,
      description: isArabic && step.popover.descriptionAr ? step.popover.descriptionAr : step.popover.description,
      side: step.popover.side,
      align: step.popover.align
    }
  };
};

// Get steps for a specific tour with localization
export const getTourSteps = (tourId, language = 'en') => {
  const tour = TOUR_CONFIG[tourId];
  if (!tour) return [];

  return tour.steps.map(step => getLocalizedStep(step, language));
};

export default TOUR_CONFIG;
