import "./ProfileSidebar.module.css"
import { NavLink } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function ProfileSidebar() {
  const { logout } = useContext(AuthContext);

  return (
    <aside
      className="d-none d-lg-flex flex-column bg-white border-end"
      style={{
        width: 240,
        position: 'sticky',
        top: 56,                       
        height: 'calc(100vh - 56px)',
      }}
    >
      <nav className="nav flex-column py-3">
        {/* Profile link */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `nav-link d-flex align-items-center px-3 py-2 ${
              isActive
                ? 'active fw-bold text-primary'
                : 'text-dark hover-bg-light'
            }`
          }
        >
          <FaUser className="me-2" />
          Profile
        </NavLink>

        <hr className="my-2" style={{ margin: 0 }} />

        {/* Logout button */}
        <button
          type="button"
          className="nav-link d-flex align-items-center px-3 py-2 text-danger hover-bg-light"
          onClick={logout}
        >
          <FaSignOutAlt className="me-2" />
          Logout
        </button>
      </nav>
    </aside>
  );
}
