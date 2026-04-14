import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import ClientIntakeForm from '@/pages/ClientIntakeForm';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/intake" replace />} />
      <Route path="/intake" element={<ClientIntakeForm />} />
    </Routes>
  </BrowserRouter>
);

export default App;
