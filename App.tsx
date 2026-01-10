
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Resident, PaymentRecord, ADDRESS_NUMBERS, User } from './types';
import ResidentPortal from './components/ResidentPortal';
import AdminPortal from './components/AdminPortal';
import Receipt from './components/Receipt';
import Login from './components/Login';
import AddressRegistrationComponent from './components/AddressRegistration';
import ApprovalPanel from './components/ApprovalPanel';
import { getCurrentUser, logout, getUserRegistrations, hasPermission } from './utils/auth';

const AppContent: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [needsAddressRegistration, setNeedsAddressRegistration] = useState(false);
  const navigate = useNavigate();

  // Check login status
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (user && user.role !== 'ADMIN') {
      // Check if user needs to register addresses
      const regs = getUserRegistrations(user.id);
      const approved = regs.filter(r => r.status === 'approved');
      if (approved.length === 0) {
        setNeedsAddressRegistration(true);
      }
    }
  }, []);

  // Initialize residents data
  useEffect(() => {
    const savedResidents: Resident[] = JSON.parse(localStorage.getItem('jiahe_residents') || '[]');
    const initialResidents: Resident[] = [...savedResidents];

    ADDRESS_NUMBERS.forEach(num => {
      for (let floor = 1; floor <= 10; floor++) {
        const id = `${num}-${floor}`;
        if (!initialResidents.find(r => r.id === id)) {
          initialResidents.push({
            id: id,
            addressNumber: num,
            floor: floor,
            motorcycleParking: 'none',
            motorcycleCount: 0,
            carParking: 'none',
            carCount: 0,
          });
        }
      }
    });
    setResidents(initialResidents);
    localStorage.setItem('jiahe_residents', JSON.stringify(initialResidents));

    const savedPayments = localStorage.getItem('jiahe_payments');
    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    }
  }, []);

  const addPayment = (record: PaymentRecord, updatedResident?: Resident) => {
    const existingIndex = payments.findIndex(p =>
      p.residentId === record.residentId &&
      p.year === record.year &&
      p.month === record.month
    );

    let newPayments: PaymentRecord[];
    if (existingIndex >= 0) {
      newPayments = [...payments];
      newPayments[existingIndex] = record;
    } else {
      newPayments = [...payments, record];
    }

    setPayments(newPayments);
    localStorage.setItem('jiahe_payments', JSON.stringify(newPayments));

    if (updatedResident) {
      const newResidents = residents.map(r =>
        r.id === updatedResident.id ? updatedResident : r
      );
      setResidents(newResidents);
      localStorage.setItem('jiahe_residents', JSON.stringify(newResidents));
    }

    // Trigger print and redirect to admin with success message
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        navigate('/admin', { state: { lastPayment: record, lastResident: updatedResident } });
      }, 500);
    }, 300);
  };

  const handleLoginSuccess = () => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (user && user.role !== 'ADMIN') {
      const regs = getUserRegistrations(user.id);
      const approved = regs.filter(r => r.status === 'approved');
      if (approved.length === 0) {
        setNeedsAddressRegistration(true);
        navigate('/register-address');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setNeedsAddressRegistration(false);
    navigate('/login');
  };

  const handleAddressRegistrationComplete = () => {
    setNeedsAddressRegistration(false);
    navigate('/');
  };

  // Show login if not logged in
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show address registration if needed
  if (needsAddressRegistration) {
    return (
      <AddressRegistrationComponent
        user={currentUser}
        onComplete={handleAddressRegistrationComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-black text-indigo-700">嘉禾社區管理系統</h1>
              <div className="flex gap-2">
                <Link
                  to="/"
                  className="px-4 py-2 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                >
                  住戶查詢
                </Link>
                {hasPermission(currentUser, ['KEEP', 'MGR', 'ADMIN']) && (
                  <>
                    <Link
                      to="/admin"
                      className="px-4 py-2 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                    >
                      管理設定
                    </Link>
                    <Link
                      to="/approvals"
                      className="px-4 py-2 rounded-xl font-bold hover:bg-green-50 transition-colors"
                    >
                      審核申請
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700">{currentUser.username}</p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-8">
        <Routes>
          <Route
            path="/"
            element={
              <ResidentPortal
                residents={residents}
                payments={payments}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/admin"
            element={
              hasPermission(currentUser, ['KEEP', 'MGR', 'ADMIN']) ? (
                <AdminPortal
                  residents={residents}
                  payments={payments}
                  onPaymentSubmit={addPayment}
                  currentUser={currentUser}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/approvals"
            element={
              hasPermission(currentUser, ['KEEP', 'MGR', 'ADMIN']) ? (
                <ApprovalPanel currentUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/receipt"
            element={
              payments.length > 0 ? (
                <Receipt
                  record={payments[payments.length - 1]}
                  resident={residents.find(r => r.id === payments[payments.length - 1]?.residentId)!}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/register-address"
            element={
              <AddressRegistrationComponent
                user={currentUser}
                onComplete={handleAddressRegistrationComplete}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
