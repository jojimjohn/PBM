import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable statistics card component
 * Used across Purchase module tabs for consistent stat display
 *
 * @param {string} title - Card title/label
 * @param {number|string} value - Statistic value to display
 * @param {React.Element} icon - Lucide React icon component
 * @param {string} color - Color variant (orange, green, blue, purple, cyan, red)
 */
const StatCard = ({ title, value, icon, color = 'blue' }) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">
        {icon}
      </div>
      <div className="stat-details">
        <p className="stat-label">{title}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.element.isRequired,
  color: PropTypes.oneOf(['orange', 'green', 'blue', 'purple', 'cyan', 'red'])
};

export default StatCard;
