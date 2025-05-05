import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminBlogManager from './AdminBlogManager';
import AdminRecommendManager from './AdminRecommendManager';
import ArchivePage from './ArchivePage';
import AdminAuth from './AdminAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ArchivePage />} />
        
        {/* Admin routes protected by AdminAuth */}
        <Route element={<AdminAuth />}>
          <Route path="/admin" element={<AdminBlogManager />} />
          <Route path="/admin/recommend" element={<AdminRecommendManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;