import { BrowserRouter } from 'react-router-dom';

import CssBaseline from '@mui/material/CssBaseline';

import { withErrorHandler } from '@/error-handling';
import AppErrorBoundaryFallback from '@/error-handling/fallbacks/App';
import Pages from '@/routes/Pages';
import Header from '@/sections/Header';
import SW from '@/sections/SW';
import Sidebar from '@/sections/Sidebar';

import { SendCameraDataWhenSetup } from './components/SendCameraDataWhenSetup';

function App() {
  return (
    <>
      <CssBaseline />
      <SW />
      <SendCameraDataWhenSetup />
      <BrowserRouter>
        <Header />
        <Sidebar />
        <Pages />
      </BrowserRouter>
    </>
  );
}

export default withErrorHandler(App, AppErrorBoundaryFallback);
