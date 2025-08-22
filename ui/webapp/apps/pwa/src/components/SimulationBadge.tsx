/**
 * SimulationBadge component - displays when the app is in mock/simulation mode
 * Shows a discrete indicator for developers and QA purposes
 */

import React from 'react'
import { SimulationBadgeProps } from '../types'
import { t } from '../i18n'
import styles from './SimulationBadge.module.css'

export const SimulationBadge: React.FC<SimulationBadgeProps> = ({ visible, locale }) => {
  const translations = t(locale)

  if (!visible) {
    return null
  }

  return (
    <div 
      className={styles.badge}
      role="status"
      aria-label={translations.simulated_badge}
    >
      <span className={styles.icon}>🔧</span>
      <span className={styles.text}>
        {translations.simulated_badge}
      </span>
    </div>
  )
}

export default SimulationBadge