import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Icons } from './ui/Icons'
import { cn } from '../lib/utils'

const CompanySwitcher = () => {
  const { user, selectedCompany, switchCompany, canSwitchCompany } = useAuth()
  const [companies, setCompanies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch('/data/companies.json')
        const data = await response.json()
        setCompanies(data.companies)
      } catch (error) {
        setError('Failed to load companies')
      }
    }
    
    loadCompanies()
  }, [])

  const handleCompanySwitch = async (companyId) => {
    if (companyId === selectedCompany?.id) return

    setIsLoading(true)
    setError('')

    try {
      await switchCompany(companyId)
      // The context will handle state updates
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!canSwitchCompany()) {
    return null
  }

  // Filter companies based on user access
  const accessibleCompanies = companies.filter(company => 
    user?.companies.includes(company.id)
  )

  if (accessibleCompanies.length <= 1) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icons.refresh className="h-5 w-5" />
          Company Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Company */}
        <div className={cn(
          "p-4 rounded-lg border-2 mb-4 transition-all duration-200",
          selectedCompany?.id === 'alramrami' 
            ? "border-alramrami-300 bg-gradient-to-r from-slate-50 to-blue-50" 
            : "border-pridemuscat-300 bg-gradient-to-r from-green-50 to-emerald-50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedCompany?.businessType === 'oil' ? (
                <Icons.droplets className="h-6 w-6 text-alramrami-500" />
              ) : (
                <Icons.recycle className="h-6 w-6 text-pridemuscat-500" />
              )}
              <div>
                <h4 className={cn(
                  "font-semibold",
                  selectedCompany?.id === 'alramrami' ? "text-alramrami-700" : "text-pridemuscat-700"
                )}>
                  {selectedCompany?.name}
                </h4>
                <Badge 
                  variant={selectedCompany?.id === 'alramrami' ? 'alramrami' : 'pridemuscat'}
                  className="mt-1"
                >
                  {selectedCompany?.businessType === 'oil' ? 'Oil Business' : 'Scrap Business'}
                </Badge>
              </div>
            </div>
            <Badge variant="success" className="text-xs">
              Current
            </Badge>
          </div>
        </div>

        {/* Switch Options */}
        {accessibleCompanies.length > 1 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Switch to:</h5>
            <div className="space-y-2">
              {accessibleCompanies
                .filter(company => company.id !== selectedCompany?.id)
                .map(company => (
                  <Button
                    key={company.id}
                    variant="outline"
                    className={cn(
                      "w-full justify-start h-auto p-3 transition-all duration-200",
                      company.id === 'alramrami' 
                        ? "border-alramrami-200 hover:border-alramrami-300 hover:bg-alramrami-50" 
                        : "border-pridemuscat-200 hover:border-pridemuscat-300 hover:bg-pridemuscat-50"
                    )}
                    onClick={() => handleCompanySwitch(company.id)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      {company.businessType === 'oil' ? (
                        <Icons.droplets className="h-5 w-5 text-alramrami-500" />
                      ) : (
                        <Icons.recycle className="h-5 w-5 text-pridemuscat-500" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">{company.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {company.businessType === 'oil' ? 'Oil Business' : 'Scrap Business'}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-3">
            <div className="flex items-center text-sm text-blue-800">
              <Icons.loader className="mr-2 h-4 w-4" />
              Switching company...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CompanySwitcher