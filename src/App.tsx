import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import ClientIntakeForm from '@/pages/ClientIntakeForm';
import CourseIntakeForm from '@/pages/CourseIntakeForm';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/course" replace />} />
      <Route path="/intake" element={<ClientIntakeForm />} />
      <Route path="/course" element={<CourseIntakeForm />} />
    </Routes>
  </BrowserRouter>
);

export default App;
