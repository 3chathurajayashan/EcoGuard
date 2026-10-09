import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';

const navItems = [
  ['/home', '⌂', 'Home'],
  ['/map', '⌖', 'Map'],
  ['/patrol', '◎', 'Patrol'],
  ['/reports', '▤', 'Reports'],
  ['/profile', '♙', 'Profile'],
];

/** One shared bottom navigation for all screens. */
export function BottomNav({ pending = false }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(([to, icon, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-item selected' : 'nav-item'}>
        <span className="nav-icon" aria-hidden="true">{icon}{label === 'Patrol' && pending ? <i className="nav-dot" /> : null}</span><span>{label}</span>
      </NavLink>)}
    </nav>
  );
}

BottomNav.propTypes = { pending: PropTypes.bool };
