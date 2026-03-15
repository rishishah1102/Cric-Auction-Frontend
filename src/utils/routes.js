// Components
import PrivateRoute from '../components/PrivateRoute';
import Auction from '../pages/Auction';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import Players from '../pages/Players';
import Squads from '../pages/Squads';

// Icons
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import GavelIcon from '@mui/icons-material/Gavel';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import PeopleIcon from '@mui/icons-material/People';

const routes = [
  {
    path: "/",
    name: "Home",
    icon: HomeIcon,
    element:<PrivateRoute element={<Home />} headerText={"Home"} />,
  },
  {
    path: "/profile",
    name: "Profile",
    icon: PersonIcon,
    element: <PrivateRoute element={<Profile />} headerText="Profile" />,
  },
  {
    path: "/auction",
    name: "Auction",
    icon: GavelIcon,
    element: <PrivateRoute element={<Auction />} headerText="Auction" />,
  },
  {
    path: "/players",
    name: "Players",
    icon: SportsCricketIcon,
    element: <PrivateRoute element={<Players />} headerText="Players" />,
  },
  {
    path: "/squads",
    name: "Squads",
    icon: PeopleIcon,
    element: <PrivateRoute element={<Squads />} headerText="Squads" />,
  },
];

export default routes;
