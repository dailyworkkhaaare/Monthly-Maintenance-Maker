import React, { useState } from 'react';
import { Plus, Download, Trash2, FileSpreadsheet, AlertCircle } from 'lucide-react';

// Interfaces for type safety
interface MaintenanceItem {
  id: number;
  item: string;
  month: string;
  amount: number;
  deadline: string;
  status: string;
}

interface NewItemState {
  item: string;
  month: string;
  amount: string; // Keep as string for input handling, parse on submit
  deadline: string;
  status: string;
}

interface ValidationErrors {
  item?: string;
  month?: string;
  amount?: string;
}

// Utility function to generate the default report title based on the current date
const getCurrentReportTitle = (): string => {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const year = now.getFullYear();
    return `OFFICE MAINTENANCE SPENDING ${month} ${year}`;
};

const MaintenanceMaker: React.FC = () => {
  // State for the list of items
  const [items, setItems] = useState<MaintenanceItem[]>([]);

  // State for the form inputs
  const [newItem, setNewItem] = useState<NewItemState>({
    item: '',
    month: '',
    amount: '',
    deadline: '',
    status: 'Pending'
  });

  // State for validation errors
  const [errors, setErrors] = useState<ValidationErrors>({});

  // State for delete confirmation modal
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Initialize reportTitle with the current month and year
  const [reportTitle, setReportTitle] = useState<string>(getCurrentReportTitle());

  // Calculate Total
  const totalAmount = items.reduce((sum, curr) => sum + (curr.amount || 0), 0);

  // Generate Month Options (Next month + Last 3 months)
  const getMonthOptions = (): string[] => {
    const options: string[] = [];
    const today = new Date();
    // i = -1 : Next Month
    // i = 0  : Current Month
    // i = 1,2,3 : Past 3 Months
    for (let i = -1; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const yearShort = d.getFullYear().toString().slice(-2);
      options.push(`${monthShort}-${yearShort}`);
    }
    return options;
  };

  const monthOptions = getMonthOptions();

  // Handle Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for the specific field when user modifies it
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Validate Form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    if (!newItem.item.trim()) {
      newErrors.item = 'Item Name is required';
      isValid = false;
    }

    if (!newItem.month) {
      newErrors.month = 'Billing Month is required';
      isValid = false;
    }

    const amountValue = parseFloat(newItem.amount);
    if (!newItem.amount || isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = 'Valid amount > 0 required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Add New Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Run validation
    if (!validateForm()) return;

    setItems(prev => [
      ...prev,
      {
        id: Date.now(), // simple unique id
        item: newItem.item,
        month: newItem.month,
        amount: parseFloat(newItem.amount),
        deadline: newItem.deadline,
        status: newItem.status
      }
    ]);

    // Reset form but keep month if desirable (user often enters multiple items for same month)
    setNewItem({
      item: '',
      month: newItem.month, 
      amount: '',
      deadline: '',
      status: 'Pending'
    });
    setErrors({}); // Clear any lingering errors
  };

  // Initiate Delete (Open Modal)
  const handleDelete = (id: number) => {
    setItemToDelete(id);
  };

  // Confirm Delete Action
  const confirmDelete = () => {
    if (itemToDelete !== null) {
      setItems(items.filter(item => item.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  // Cancel Delete Action
  const cancelDelete = () => {
    setItemToDelete(null);
  };

  // Format Currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format Date for Display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Export to Excel (HTML Table method for styling)
  const exportToExcel = () => {
    const tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Maintenance Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #E5E7EB; color: #000; border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold; }
          td { border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; }
          .text-left { text-align: left; }
          .total-row { background-color: #E5E7EB; font-weight: bold; font-size: 1.1em; }
          .title-row { font-size: 18px; font-weight: bold; text-align: center; border: none; padding: 20px; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="6" class="title-row" style="border: none;">${reportTitle.toUpperCase()}</td>
          </tr>
          <tr>
            <th style="width: 60px;">Sr.No</th>
            <th style="width: 300px;">Item</th>
            <th style="width: 100px;">Month</th>
            <th style="width: 120px;">Amount</th>
            <th style="width: 150px;">Payment deadline</th>
            <th style="width: 100px;">Status</th>
          </tr>
          ${items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td class="text-left">${item.item}</td>
              <td>${item.month}</td>
              <td>${formatCurrency(item.amount)}</td>
              <td>${formatDate(item.deadline)}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="3" style="text-align: center;">TOTAL</td>
            <td>${formatCurrency(totalAmount)}</td>
            <td colspan="2"></td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Add BOM (\uFEFF) to ensure Excel reads UTF-8 correctly
    const blob = new Blob(['\uFEFF', tableHTML], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Maintenance_Report.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Title Editor */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Monthly Maintenance Maker</h1>
              <p className="text-slate-500 text-sm">Generate and export expense reports</p>
            </div>
          </div>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <Download size={20} />
            Download Excel
          </button>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <div className="bg-slate-800 text-white p-4 flex items-center gap-2">
            <Plus size={20} />
            <h2 className="font-semibold">Add New Expense Entry</h2>
          </div>
          <form onSubmit={handleAddItem} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Item Name */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="item"
                value={newItem.item}
                onChange={handleInputChange}
                placeholder="e.g., Internet Bill"
                className={`w-full p-2.5 border rounded-lg outline-none transition-all duration-200 ${
                  errors.item 
                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 bg-red-50' 
                    : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                }`}
              />
              {errors.item && (
                <div className="flex items-center gap-1 mt-1 text-red-600 text-xs font-medium animate-pulse">
                  <AlertCircle size={12} />
                  <span>{errors.item}</span>
                </div>
              )}
            </div>

            {/* Month */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bill Month <span className="text-red-500">*</span>
              </label>
              <select
                name="month"
                value={newItem.month}
                onChange={handleInputChange}
                className={`w-full p-2.5 border rounded-lg outline-none transition-all duration-200 bg-white ${
                  errors.month 
                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 bg-red-50' 
                    : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                }`}
              >
                <option value="">Select</option>
                {monthOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.month && (
                <div className="flex items-center gap-1 mt-1 text-red-600 text-xs font-medium">
                  <AlertCircle size={12} />
                  <span>{errors.month}</span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={newItem.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={`w-full pl-8 p-2.5 border rounded-lg outline-none transition-all duration-200 ${
                    errors.amount 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 bg-red-50' 
                      : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                  }`}
                />
              </div>
              {errors.amount && (
                <div className="flex items-center gap-1 mt-1 text-red-600 text-xs font-medium">
                  <AlertCircle size={12} />
                  <span>{errors.amount}</span>
                </div>
              )}
            </div>

            {/* Deadline */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
              <input
                type="date"
                name="deadline"
                value={newItem.deadline}
                onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none text-slate-600 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-200"
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                name="status"
                value={newItem.status}
                onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-200"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-12 flex justify-end mt-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
                <Plus size={18} /> Add to List
              </button>
            </div>
          </form>
        </div>

        {/* Report Preview */}
        <div className="bg-white shadow-xl border border-slate-300 overflow-hidden">
          
          {/* Editable Title */}
          <div className="p-6 text-center border-b border-slate-300 bg-white">
            <input 
              type="text" 
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="text-xl md:text-2xl font-bold text-center w-full uppercase tracking-wide bg-transparent outline-none border border-transparent rounded-lg hover:bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-200 placeholder-slate-300"
              placeholder="ENTER REPORT TITLE HERE..."
            />
          </div>

          {/* The Table */}
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full border-collapse relative">
              <thead>
                <tr className="bg-gray-200 text-slate-900">
                  <th className="sticky top-0 z-10 bg-gray-200 border border-slate-900 px-4 py-3 font-bold w-16 text-center shadow-[0_1px_0_0_#0f172a]">Sr.No</th>
                  <th className="sticky top-0 z-10 bg-gray-200 border border-slate-900 px-4 py-3 font-bold text-left shadow-[0_1px_0_0_#0f172a]">Item</th>
                  <th className="sticky top-0 z-10 bg-gray-200 border border-slate-900 px-4 py-3 font-bold text-center w-32 shadow-[0_1px_0_0_#0f172a]">Month</th>
                  <th className="sticky top-0 z-10 bg-gray-200 border border-slate-900 px-4 py-3 font-bold text-center w-32 shadow-[0_1px_0_0_#0f172a]">Amount</th>
                  <th className="sticky top-0 z-10 bg-gray-200 border border-slate-900 px-4 py-3 font-bold text-center w-48 shadow-[0_1px_0_0_#0f172a]">Payment deadline</th>
                  <th className="sticky top-0 z-10 bg-gray-200 border border-slate-900 px-4 py-3 font-bold text-center w-32 shadow-[0_1px_0_0_#0f172a]">Status</th>
                  <th className="sticky top-0 z-10 bg-white border-none px-2 py-3 font-bold w-12 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-blue-50 transition-colors">
                    <td className="border border-slate-900 px-4 py-3 text-center font-medium">{index + 1}</td>
                    <td className="border border-slate-900 px-4 py-3 text-slate-800 font-medium">{item.item}</td>
                    <td className="border border-slate-900 px-4 py-3 text-center text-slate-600">{item.month}</td>
                    <td className="border border-slate-900 px-4 py-3 text-center font-medium text-slate-800 tracking-wide">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="border border-slate-900 px-4 py-3 text-center text-slate-600">
                      {formatDate(item.deadline)}
                    </td>
                    <td className="border border-slate-900 px-4 py-3 text-center font-semibold">
                      <span className={`${
                        item.status === 'Paid' ? 'text-green-600' : 
                        item.status === 'Overdue' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center print:hidden border-none">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-0"
                        title="Remove Entry"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {/* Empty State if no items */}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      No entries yet. Add an item above.
                    </td>
                  </tr>
                )}
              </tbody>
              
              {/* Total Row */}
              <tfoot className="bg-gray-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="border border-slate-900 px-4 py-3 text-center uppercase tracking-wider text-lg">
                    Total
                  </td>
                  <td className="border border-slate-900 px-4 py-3 text-center text-lg">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td className="border border-slate-900 bg-gray-200"></td>
                  <td className="border border-slate-900 bg-gray-200"></td>
                  <td className="bg-white border-none"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="text-center text-slate-400 text-sm">
          Tip: You can click the header title to rename your report before downloading.
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100 ring-1 ring-slate-900/5">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Item?</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Are you sure you want to remove this expense from your list? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={cancelDelete} 
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceMaker;