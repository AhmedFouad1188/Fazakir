import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import Cart from "../components/cart";
import logo from "../assets/logo.png";
import styles from "../styles/navbar.module.css";

import {
  Navbar,
  Offcanvas,
  Nav,
  Container,
  Button
} from "react-bootstrap";

const NavbarComponent = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [show, setShow] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setShow(false); // Close offcanvas after logout
  };

  return (
    <>
      <Navbar>
        <Container fluid className={styles.navcont}>
          <Link to="/" className="navbar-brand">
            <img src={logo} alt="Fazakir Logo" />
          </Link>

          {/* Desktop Links */}
          <div className={styles.desknav}>
            <Cart />
            {user ? (
              <>
                <Link to="/orders" className={styles.links}>الطلبـــات</Link>
                <Link to="/account" className={styles.links}>الحســـاب</Link>
                {user.is_admin && (
                  <Link to="/admin" className={styles.links}>لوحة تحكم الأدمن</Link>
                )}
                <button onClick={handleLogout}>
                  الـخـــروج
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.links}>تسجيل الدخول</Link>
            )}
          </div>

          <div className={styles.mobnav}>
            <Cart />
  
            {/* Toggle Button for Mobile */}
            <button onClick={() => setShow(true)}>
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>
        </Container>
      </Navbar>

      {/* Mobile Sidebar Offcanvas */}
      <Offcanvas
        show={show}
        onHide={() => setShow(false)}
        placement="end"
        className={styles.offcanvas}
      >
        <Offcanvas.Header closeButton>
        </Offcanvas.Header>
        <Offcanvas.Body className={styles.offcanvasbody}>
          {user ? (
            <>
              <Link to="/orders" onClick={() => setShow(false)} className={styles.links}>الطلبـــات</Link>
              <Link to="/account" onClick={() => setShow(false)} className={styles.links}>الحســـاب</Link>
              {user.is_admin && (
                <Link to="/admin" onClick={() => setShow(false)} className={styles.links}>لوحة تحكم الأدمن</Link>
              )}
              <Button onClick={handleLogout}>
                الـخـــروج
              </Button>
            </>
          ) : (
            <Link to="/login" onClick={() => setShow(false)}>تسجيل الدخول</Link>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default NavbarComponent;
