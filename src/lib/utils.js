// Simple className utility without tailwind-merge dependency
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}

export function formatCurrency(amount, currency = 'OMR') {
  return new Intl.NumberFormat('en-OM', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount)
}

export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date))
}

export function getCompanyTheme(companyId) {
  const themes = {
    alramrami: {
      primary: '#2c3e50',
      secondary: '#3498db',
      name: 'Al Ramrami Trading',
      gradient: 'from-slate-900 to-slate-700'
    },
    pridemuscat: {
      primary: '#27ae60',
      secondary: '#2ecc71', 
      name: 'Pride Muscat International',
      gradient: 'from-green-600 to-green-500'
    }
  }
  
  return themes[companyId] || themes.alramrami
}