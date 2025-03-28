import { Route, Routes } from 'react-router-dom';
import CosignerVerification from './CosignerVerification';

const CosignerRoutes = () => {
  return (
    <Routes>
      <Route path="/verify/:token" element={<CosignerVerification />} />
    </Routes>
  );
};

export default CosignerRoutes;