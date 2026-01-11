
import React from 'react';
import { PaymentRecord, Resident } from '../types';

interface Props {
  record: PaymentRecord;
  resident: Resident;
  operatorName?: string;
}

const Receipt: React.FC<Props> = ({ record, resident, operatorName }) => {
  return (
    <div className="p-8 border-4 border-double border-gray-900 bg-white max-w-2xl mx-auto my-4 font-serif print-only">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black mb-2">嘉禾社區管理委員會</h1>
        <h2 className="text-2xl font-bold tracking-[0.5em] border-b-4 border-gray-900 inline-block pb-2">正式收據</h2>
      </div>

      <div className="flex justify-between mb-8 text-xl">
        <div className="space-y-1">
          <p><span className="font-bold">住戶編號：</span>{resident.addressNumber} 號 {resident.floor} 樓</p>
          <p><span className="font-bold">經辦帳號：</span>{operatorName || '系統預設'}</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold">列印日期：</span>{new Date(record.paidAt).toLocaleDateString()}</p>
        </div>
      </div>

      <table className="w-full mb-10 border-collapse border-2 border-gray-900">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-2 border-gray-900 p-3 text-left">收費項目</th>
            <th className="border-2 border-gray-900 p-3 text-center">繳費起算年月</th>
            <th className="border-2 border-gray-900 p-3 text-center">繳費結算年月</th>
            <th className="border-2 border-gray-900 p-3 text-right">小計</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-2 border-gray-900 p-3 font-bold">社區管理費</td>
            <td className="border-2 border-gray-900 p-3 text-center">{record.prevManagementStart}</td>
            <td className="border-2 border-gray-900 p-3 text-center text-red-600 font-bold">{record.nextManagementStart}</td>
            <td className="border-2 border-gray-900 p-3 text-right font-mono">${record.managementFee}</td>
          </tr>
          <tr>
            <td className="border-2 border-gray-900 p-3 font-bold">機車停車費</td>
            <td className="border-2 border-gray-900 p-3 text-center">{record.prevMotorcycleStart}</td>
            <td className="border-2 border-gray-900 p-3 text-center text-red-600 font-bold">{record.nextMotorcycleStart}</td>
            <td className="border-2 border-gray-900 p-3 text-right font-mono">${record.motorcycleFee}</td>
          </tr>
          <tr>
            <td className="border-2 border-gray-900 p-3 font-bold">汽車停車費</td>
            <td className="border-2 border-gray-900 p-3 text-center">{record.prevCarStart}</td>
            <td className="border-2 border-gray-900 p-3 text-center text-red-600 font-bold">{record.nextCarStart}</td>
            <td className="border-2 border-gray-900 p-3 text-right font-mono">${record.carFee}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="font-black text-2xl bg-gray-50">
            <td className="border-2 border-gray-900 p-3" colSpan={3}>應繳總計 (TOTAL)</td>
            <td className="border-2 border-gray-900 p-3 text-right font-mono">${record.total}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mb-8">
        <p className="text-gray-700 italic border-l-4 border-gray-300 pl-4 text-xs">
          備註：繳費總額已包含預繳月份。本收據自動產生，請妥善保存核對。
        </p>
      </div>

      <div className="flex justify-end items-end">
        <div className="text-center">
          <div className="w-40 h-px bg-gray-600 mb-2 mx-auto"></div>
          <p className="text-sm font-bold">經辦人簽章</p>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
