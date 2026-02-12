import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import {
  HomeOutlined,
  UploadOutlined,
  UnorderedListOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { HomePage, ArtifactUpload, ArtifactList, TourGuideChat } from '@/pages';
import './App.scss';

const { Header, Content, Footer } = Layout;

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { key: '/', label: '首页', icon: <HomeOutlined /> },
    { key: '/artifacts', label: '文物列表', icon: <UnorderedListOutlined /> },
    { key: '/upload', label: '文物上传', icon: <UploadOutlined /> },
    { key: '/chat', label: '智能导览', icon: <MessageOutlined /> },
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-inner">
          <Link to="/" className="app-logo">
            <span className="logo-seal">博</span>
            <span className="logo-text">智能文物导览</span>
          </Link>
          <nav className="app-nav">
            {menuItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${location.pathname === item.key ? 'active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </Header>
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/artifacts" element={<ArtifactList />} />
          <Route path="/upload" element={<ArtifactUpload />} />
          <Route path="/chat" element={<TourGuideChat />} />
        </Routes>
      </Content>
      <Footer className="app-footer">
        <div className="footer-inner">
          <span className="footer-seal">数字文博</span>
          <span className="footer-text">智能文物导览系统 ©2026</span>
        </div>
      </Footer>
    </Layout>
  );
}

function App() {
  return (
    <ConfigProvider>
      <Router>
        <AppContent />
      </Router>
    </ConfigProvider>
  );
}

export default App;
