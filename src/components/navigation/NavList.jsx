import React from 'react'
import { NavLink } from 'react-router-dom'

function NavList({Icon, name, route, isOpen}) {
  return (
    <li style={{width: isOpen ? "120%" : "25%"}}>
        <NavLink to={route} className={`${isOpen ? "openNavLink" : "closedNavLink"}`}>
            <Icon />
            <span className="links_name" style={{opacity: isOpen ? "1" : "0"}}>{name}</span>
        </NavLink>
    </li>
  )
}

export default NavList