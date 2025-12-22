import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Command, ArrowRight, Clock, Star,
  FileText, Users, Package, Banknote, Settings,
  TrendingUp, Truck, Receipt, Calculator, Home
} from 'lucide-react'
import './CommandPalette.css'

/**
 * CommandPalette Component
 *
 * Keyboard-accessible command menu for quick navigation and actions
 * Inspired by cmd+k patterns in modern applications
 *
 * @param {boolean} isOpen - Palette visibility state
 * @param {Function} onClose - Close handler
 * @param {Array} commands - Available commands/actions
 * @param {Function} onExecute - Command execution handler
 * @param {Array} recentCommands - Recently used commands
 */
const CommandPalette = ({
  isOpen,
  onClose,
  commands = [],
  onExecute,
  recentCommands = []
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filteredCommands, setFilteredCommands] = useState([])
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Icon mapping for command types
  const iconMap = {
    navigation: ArrowRight,
    dashboard: Home,
    customers: Users,
    suppliers: Truck,
    inventory: Package,
    sales: Banknote,
    purchase: Receipt,
    reports: TrendingUp,
    settings: Settings,
    documents: FileText,
    calculator: Calculator,
    recent: Clock,
    favorite: Star
  }

  // Filter commands based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show recent commands when no search
      const recent = recentCommands.slice(0, 5)
      setFilteredCommands(recent.length > 0 ? recent : commands.slice(0, 8))
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = commands.filter(cmd =>
        cmd.title.toLowerCase().includes(query) ||
        cmd.description?.toLowerCase().includes(query) ||
        cmd.keywords?.some(kw => kw.toLowerCase().includes(query))
      )
      setFilteredCommands(filtered.slice(0, 10))
    }
    setSelectedIndex(0)
  }, [searchQuery, commands, recentCommands])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            handleExecute(filteredCommands[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = containerRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    )
    selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIndex])

  const handleExecute = (command) => {
    onExecute(command)
    setSearchQuery('')
    onClose()
  }

  const getIcon = (command) => {
    const IconComponent = iconMap[command.icon || command.type] || FileText
    return <IconComponent className="command-icon" size={18} />
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="command-palette-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          className="command-palette"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="command-palette-header">
            <Search className="search-icon" size={20} />
            <input
              ref={inputRef}
              type="text"
              className="command-search-input"
              placeholder="Type a command or search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="keyboard-shortcut">Esc</kbd>
          </div>

          {/* Commands List */}
          <div className="command-palette-content" ref={containerRef}>
            {filteredCommands.length > 0 ? (
              <>
                {!searchQuery && recentCommands.length > 0 && (
                  <div className="command-section-label">
                    <Clock size={14} />
                    Recent
                  </div>
                )}
                {filteredCommands.map((command, index) => (
                  <motion.button
                    key={command.id || index}
                    data-index={index}
                    className={`command-item ${
                      index === selectedIndex ? 'selected' : ''
                    }`}
                    onClick={() => handleExecute(command)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="command-item-left">
                      {getIcon(command)}
                      <div className="command-item-content">
                        <span className="command-title">{command.title}</span>
                        {command.description && (
                          <span className="command-description">
                            {command.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="command-item-right">
                      {command.shortcut && (
                        <kbd className="command-shortcut">{command.shortcut}</kbd>
                      )}
                      <ArrowRight className="command-arrow" size={16} />
                    </div>
                  </motion.button>
                ))}
              </>
            ) : (
              <div className="command-empty">
                <Search size={32} />
                <p>No commands found</p>
                <span>Try searching for something else</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="command-palette-footer">
            <div className="footer-shortcuts">
              <span className="footer-shortcut">
                <kbd>↑</kbd><kbd>↓</kbd> Navigate
              </span>
              <span className="footer-shortcut">
                <kbd>↵</kbd> Select
              </span>
              <span className="footer-shortcut">
                <kbd>Esc</kbd> Close
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export default CommandPalette
