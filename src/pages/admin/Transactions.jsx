import { useState, useEffect } from 'react';
import { BiRefresh, BiDownload } from 'react-icons/bi';
import apiService from '../../helper/apiClient';
import toast from 'react-hot-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAllTransactions(page, limit);
      if (data.success) {
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const loadingToast = toast.loading('Downloading Invoice...');
      const response = await apiService.downloadInvoice(orderId);

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId}.pdf`);

      // Append to html link element page
      document.body.appendChild(link);

      // Start download
      link.click();

      // Clean up and remove the link
      link.parentNode.removeChild(link);
      toast.dismiss(loadingToast);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">All Transactions</h1>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <BiRefresh className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((txn) => (
              <tr key={txn._id}>
                <td className="px-6 py-4">
                  <div className="font-medium">{txn.userId?.name}</div>
                  <div className="text-sm text-gray-500">{txn.userId?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${txn.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {txn.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold">
                  <span className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{txn.description}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(txn.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {txn.razorpayOrderId && txn.status === 'captured' && (
                    <button
                      onClick={() => handleDownloadInvoice(txn.razorpayOrderId)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full tooltip"
                      title="Download Invoice"
                    >
                      <BiDownload size={20} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Transactions;
