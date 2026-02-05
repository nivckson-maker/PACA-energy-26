import React, { useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { Menu, X, Linkedin, Facebook, Lock } from 'lucide-react';

import { auth, db, appId } from './firebaseConfig.ts';
import { Project, Service, Inquiry } from './types.ts';
import { INITIAL_PROJECTS, INITIAL_SERVICES, ADMIN_USERNAME, ADMIN_PASSWORD, ADDRESS } from './constants.ts';

import { Button } from './components/ui/Button.tsx';
import { Logo } from './components/ui/Logo.tsx';
import { SectionHeading } from './components/ui/SectionHeading.tsx';
import { Hero } from './components/sections/Hero.tsx';
import { TrustTicker } from './components/sections/TrustTicker.tsx';
import { AboutPreview } from './components/sections/AboutPreview.tsx';
import { ServicesList } from './components/sections/ServicesList.tsx';
import { ProjectsGrid } from './components/sections/ProjectsGrid.tsx';
import { ContactSection } from './components/sections/ContactSection.tsx';
import { AdminSidebar } from './components/admin/AdminSidebar.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AdminProjectManager } from './components/admin/AdminProjectManager.tsx';
import { AdminInquiries } from './components/admin/AdminInquiries.tsx';

// Handle global injection for custom token if available
declare global {
  interface Window {
    __initial_auth_token?: string;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data State - Initialize with constants for offline/demo support
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  // Auth & Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error: any) {
        // Suppress invalid API key error for demo purposes
        if (error?.code === 'auth/api-key-not-valid' || error?.message?.includes('api-key')) {
          console.warn("Running in demo mode (Firebase Auth unavailable)");
        } else {
          console.error("Auth init failed", error);
        }
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    // Projects
    const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
    const qProjects = query(projectsRef, orderBy('year', 'desc'));
    
    let unsubProjects = () => {};
    try {
      unsubProjects = onSnapshot(qProjects, (snap) => {
        if (!snap.empty) {
          setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
        }
      }, (err) => {
        console.warn("Using local projects data");
      });
    } catch (e) {
       console.warn("Using local projects data");
    }

    // Services
    const servicesRef = collection(db, 'artifacts', appId, 'public', 'data', 'services');
    let unsubServices = () => {};
    try {
      unsubServices = onSnapshot(servicesRef, (snap) => {
        if (!snap.empty) {
          setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
        }
      }, () => {});
    } catch (e) {
      // Keep initial services
    }

    // Inquiries
    const inquiriesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'inquiries');
    const qInquiries = query(inquiriesRef, orderBy('createdAt', 'desc'));
    let unsubInquiries = () => {};
    try {
      unsubInquiries = onSnapshot(qInquiries, (snap) => {
        setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Inquiry)));
      }, () => {});
    } catch (e) { /* ignore */ }

    return () => {
      unsubProjects();
      unsubServices();
      unsubInquiries();
    };
  }, [user]);

  // Actions
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD && adminUsername === ADMIN_USERNAME) {
      setIsAdminMode(true);
      setPage('admin');
    } else {
      alert("Invalid credentials.");
    }
  };

  const handleLogout = () => {
    setIsAdminMode(false);
    setPage('home');
    setAdminUsername('');
    setAdminPassword('');
  };

  const addProject = async (project: Omit<Project, 'id'>) => {
    // Optimistic local update
    const newId = 'temp-' + Date.now();
    setProjects(prev => [{ id: newId, ...project } as Project, ...prev]);

    if (!user) return; // Offline mode

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), {
        ...project,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Backend sync failed", e);
    }
  };

  const deleteProject = async (id: string) => {
    // Optimistic local update
    setProjects(prev => prev.filter(p => p.id !== id));

    if (!user) return; // Offline mode
    if (id.startsWith('p') || id.startsWith('temp-')) return; // Local data

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', id));
    } catch (e) { console.error(e); }
  };

  const submitInquiry = async (data: Inquiry) => {
    // 1. Send to Formspree
    const response = await fetch("https://formspree.io/f/xeegegyw", {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error("Failed to send inquiry via Formspree");
    }

    // 2. Save to Firebase (Backup for Admin Dashboard)
    if (user) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'inquiries'), {
          ...data,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.warn("Firebase backup failed, but email sent successfully", e);
      }
    }
  };

  // --- Render ---

  if (isAdminMode) {
    return (
      <div className="flex bg-slate-100 min-h-screen font-sans">
        <AdminSidebar activeTab={adminTab} setActiveTab={setAdminTab} onLogout={handleLogout} />
        <main className="ml-64 flex-1 p-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {adminTab === 'dashboard' && 'Admin Dashboard'}
              {adminTab === 'projects' && 'Project Management'}
              {adminTab === 'services' && 'Service Management'}
              {adminTab === 'inquiries' && 'Inquiry Inbox'}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Logged in as Admin</span>
              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white text-xs">AD</div>
            </div>
          </header>

          {adminTab === 'dashboard' && <AdminDashboard stats={{ projects: projects.length, services: services.length, inquiries: inquiries.length }} />}
          {adminTab === 'projects' && <AdminProjectManager projects={projects} onAdd={addProject} onDelete={deleteProject} />}
          {adminTab === 'services' && <div className="p-8 bg-white rounded shadow text-center text-gray-500">Service editing coming soon.</div>}
          {adminTab === 'inquiries' && <AdminInquiries inquiries={inquiries} />}
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => setPage('home')}>
             <Logo className="h-16 w-auto" />
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
            {['Home', 'About', 'Services', 'Projects'].map(item => (
              <button 
                key={item} 
                onClick={() => setPage(item.toLowerCase())}
                className={`hover:text-blue-900 transition-colors ${page === item.toLowerCase() ? 'text-blue-900 font-bold' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="hidden md:flex gap-4">
             <Button variant="primary" className="!py-2 !text-sm" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
               Send Enquiry
             </Button>
          </div>

          <button className="md:hidden text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-30 pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-lg font-medium">
            {['Home', 'About', 'Services', 'Projects'].map(item => (
              <button key={item} onClick={() => { setPage(item.toLowerCase()); setMobileMenuOpen(false); }} className="text-left py-2 border-b border-gray-100">
                {item}
              </button>
            ))}
            <Button variant="primary" className="w-full mt-4" onClick={() => { setMobileMenuOpen(false); document.getElementById('contact')?.scrollIntoView(); }}>
              Send Enquiry
            </Button>
            <button onClick={() => { setPage('login'); setMobileMenuOpen(false); }} className="text-sm text-gray-400 mt-8 flex items-center gap-2">
              <Lock size={14} /> Admin Access
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {page === 'home' && (
          <>
            <Hero navigate={setPage} />
            <TrustTicker />
            <AboutPreview navigate={setPage} />
            <ServicesList services={services} />
            <ProjectsGrid projects={projects} />
            <ContactSection onInquirySubmit={submitInquiry} />
          </>
        )}

        {page === 'about' && (
          <div className="py-20 container mx-auto px-4">
            <SectionHeading title="About PACA Energy" subtitle="Company Profile" />
            <div className="max-w-4xl mx-auto prose prose-lg">
              <p>PACA Energy Services Limited is a Nigerian company established to provide construction, facilities maintenance, and project management services to the manufacturing and oil and gas industries.</p>
              <h3>Mission</h3>
              <p>To become the foremost, genuinely indigenous provider of energy, oil, and gas services.</p>
              <h3>Vision</h3>
              <p>To be a reference company for true local content development in the Nigerian oil and gas industry.</p>
              <h3>Core Values</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                <li className="bg-slate-50 p-4 rounded border-l-4 border-orange-500"><strong>Integrity:</strong> Honesty and reliability are our basis.</li>
                <li className="bg-slate-50 p-4 rounded border-l-4 border-orange-500"><strong>People:</strong> Our greatest strength. We invest heavily in training.</li>
                <li className="bg-slate-50 p-4 rounded border-l-4 border-orange-500"><strong>QHSE:</strong> Total compliance to regulations. Safety first.</li>
                <li className="bg-slate-50 p-4 rounded border-l-4 border-orange-500"><strong>Satisfaction:</strong> Customer-focused values drive our success.</li>
              </ul>
            </div>
          </div>
        )}

        {page === 'services' && <ServicesList services={services} />}
        {page === 'projects' && <ProjectsGrid projects={projects} />}
        
        {page === 'login' && (
          <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Admin Login</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                    placeholder="Enter admin username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full">Access Dashboard</Button>
              </form>
              <button onClick={() => setPage('home')} className="w-full text-center mt-4 text-sm text-gray-500 hover:text-blue-900">
                Back to Home
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-sm">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">PACA Energy</h3>
            <p className="mb-4">Delivering excellence in energy services with a commitment to local content and international standards.</p>
            <div className="flex gap-4">
              <Linkedin className="hover:text-white cursor-pointer" />
              <Facebook className="hover:text-white cursor-pointer" />
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li onClick={() => setPage('about')} className="cursor-pointer hover:text-white">About Us</li>
              <li onClick={() => setPage('projects')} className="cursor-pointer hover:text-white">Our Projects</li>
              <li onClick={() => setPage('services')} className="cursor-pointer hover:text-white">Services</li>
              <li onClick={() => setPage('login')} className="cursor-pointer hover:text-white">Admin Login</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>Fabrication</li>
              <li>Facility Maintenance</li>
              <li>Procurement</li>
              <li>Project Management</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <p className="mb-2 max-w-xs">{ADDRESS}</p>
            <p className="mb-2">+234 803 536 9473</p>
            <p>info@pacaenergyservices.com</p>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center">
          <p>&copy; 2026 PACA Energy Services Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
