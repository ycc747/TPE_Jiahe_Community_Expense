
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { Resident, PaymentRecord, ADDRESS_NUMBERS } from './types';
import ResidentPortal from './components/ResidentPortal';
import AdminPortal from './components/AdminPortal';
import Receipt from './components/Receipt';

const App: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Initialize residents data
  useEffect(() => {
    const savedResidents = localStorage.getItem('jiahe_residents');
    if (savedResidents) {
      setResidents(JSON.parse(savedResidents));
    } else {
      const initialResidents: Resident[] = [];
      ADDRESS_NUMBERS.forEach(num => {
        for (let floor = 1; floor <= 10; floor++) {
          initialResidents.push({
            id: `${num}-${floor}`,
            addressNumber: num,
            floor: floor,
            motorcycleParking: 'none',
            motorcycleCount: 0,
            carParking: 'none',
            carCount: 0,
          });
        }
      });
      setResidents(initialResidents);
    }

    const savedPayments = localStorage.getItem('jiahe_payments');
    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    }
  }, []);

  const addPayment = (record: PaymentRecord, updatedResident?: Resident) => {
    // Check if this is an override of an existing record (same resident + year + month)
    const existingIndex = payments.findIndex(p => 
      p.residentId === record.residentId && 
      p.year === record.year && 
      p.month === record.month
    );

    let updatedPayments;
    if (existingIndex > -1) {
      // Chairman Override Case
      updatedPayments = [...payments];
      updatedPayments[existingIndex] = record;
    } else {
      // Normal Add Case
      updatedPayments = [...payments, record];
    }

    setPayments(updatedPayments);
    localStorage.setItem('jiahe_payments', JSON.stringify(updatedPayments));
    
    if (updatedResident) {
      const updatedResidents = residents.map(r => r.id === updatedResident.id ? updatedResident : r);
      setResidents(updatedResidents);
      localStorage.setItem('jiahe_residents', JSON.stringify(updatedResidents));
    }

    // Trigger printing automatically
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const currentYear = new Date().getFullYear();

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <header className="bg-indigo-700 text-white shadow-lg no-print">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight">嘉禾社區管理系統</h1>
            <nav className="flex space-x-4 text-sm">
              <Link to="/" className="hover:text-indigo-200 transition">住戶查詢</Link>
              <Link to="/admin" className="hover:text-indigo-200 transition">管理設定</Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<ResidentPortal residents={residents} payments={payments} />} />
            <Route path="/admin" element={<AdminPortal residents={residents} payments={payments} onPaymentSubmit={addPayment} />} />
          </Routes>
        </main>

        <footer className="bg-gray-100 text-gray-500 py-6 text-center text-sm no-print border-t">
          <p>© {currentYear} 台北市嘉禾社區管理委員會</p>
        </footer>

        <div className="print-only">
          {payments.length > 0 && (
            <Receipt 
              record={payments[payments.length - 1]} 
              resident={residents.find(r => r.id === payments[payments.length - 1].residentId)!} 
            />
          )}
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
