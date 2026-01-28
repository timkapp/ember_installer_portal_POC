import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';


import DataCollectionConfig from './pages/admin/DataCollectionConfig';

import NewProjectWizard from './pages/installer/NewProjectWizard';

// Placeholder for Login
const Login = () => <div>Login Page</div>;

// Placeholder for other pages
import ReviewDashboard from './pages/admin/ReviewDashboard';
import ReviewProject from './pages/admin/ReviewProject';
import OrganizationManagement from './pages/admin/OrganizationManagement';
import AcceptInvite from './pages/auth/AcceptInvite';
import EvaluationDebugger from './pages/debug/EvaluationDebugger';
import ProjectList from './pages/installer/ProjectList';
import ProjectDetail from './pages/installer/ProjectDetail';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/invite" element={<AcceptInvite />} />

            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="command-center" element={<ReviewDashboard />} />
              <Route path="admin/review/:id" element={<ReviewProject />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="projects/new" element={<NewProjectWizard />} />
              <Route path="projects/:id" element={<ProjectDetail />} />

              {/* Admin Configuration Routes */}
              <Route path="admin/data-collection" element={<DataCollectionConfig />} />
              <Route path="admin/organizations" element={<OrganizationManagement />} />


              {/* Debug */}
              <Route path="debug/evaluation" element={<EvaluationDebugger />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
