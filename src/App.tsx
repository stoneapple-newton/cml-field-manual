import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Stub from '@/pages/Stub';
import Concepts from '@/pages/Concepts';
import Jobs from '@/pages/Jobs';
import Workflows from '@/pages/Workflows';
import Api from '@/pages/Api';
import Serving from '@/pages/Serving';
import Walkthrough from '@/pages/Walkthrough';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/concepts" element={<Concepts />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/api" element={<Api />} />
        <Route path="/serving" element={<Serving />} />
        <Route path="/walkthrough" element={<Walkthrough />} />
        <Route path="*" element={<Stub eyebrow="// 404" title="Not found" />} />
      </Routes>
    </Layout>
  );
}
