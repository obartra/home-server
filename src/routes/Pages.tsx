import { Route, Routes } from 'react-router-dom';

import Box from '@mui/material/Box';

import routes from './index';

function Pages() {
  return (
    <Box sx={{ mt: 8 }}>
      <Routes>
        {Object.values(routes).map(({ path, component: Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </Box>
  );
}

export default Pages;
