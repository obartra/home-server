import { Navigate } from 'react-router';

import AnnouncementIcon from '@mui/icons-material/Announcement';
import HomeIcon from '@mui/icons-material/Home';
import LiquorIcon from '@mui/icons-material/Liquor';
import PetsIcon from '@mui/icons-material/Pets';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SettingsIcon from '@mui/icons-material/Settings';

import asyncComponentLoader from '@/utils/loader';

import { Pages, Routes } from './types';

const routes: Routes = {
  [Pages.Welcome]: {
    component: asyncComponentLoader(() => import('@/pages/Welcome')),
    path: '/',
    title: 'Welcome',
    icon: HomeIcon,
  },
  [Pages.Iroh]: {
    component: asyncComponentLoader(() => import('@/pages/Iroh')),
    path: '/iroh',
    title: 'Iroh',
    icon: PetsIcon,
  },
  [Pages.Osrey]: {
    component: asyncComponentLoader(() => import('@/pages/Osrey')),
    path: '/osrey',
    title: 'Osrey',
    icon: PetsIcon,
  },
  [Pages.Cocktails]: {
    component: asyncComponentLoader(() => import('@/pages/Cocktails')),
    path: '/cocktails',
    title: 'Cocktails',
    icon: LiquorIcon,
  },
  [Pages.Emergency]: {
    component: asyncComponentLoader(() => import('@/pages/Emergency')),
    path: '/emergency',
    title: 'Emergency',
    icon: AnnouncementIcon,
  },
  [Pages.Advanced]: {
    component: asyncComponentLoader(() => import('@/pages/Advanced')),
    path: '/advanced',
    title: 'Advanced',
    icon: SettingsIcon,
  },
  [Pages.QR]: {
    component: asyncComponentLoader(() => import('@/pages/QR')),
    path: '/qr',
    title: 'QR',
    icon: QrCodeIcon,
  },
  [Pages.NotFound]: {
    component: () => <Navigate to="/" replace={true} />,
    path: '*',
  },
};

export default routes;
