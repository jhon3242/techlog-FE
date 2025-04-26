import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminBlogManager from './AdminBlogManager';
import ArchivePage from './ArchivePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ArchivePage />} />
        <Route path="/admin" element={<AdminBlogManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;