import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getContactBatches } from '../../redux/slices/campaignSlice';

const ContactBatchList = ({ campaignId }) => {
  const dispatch = useDispatch();
  const { contactBatches } = useSelector(state => state.campaigns);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaignId) {
      setLoading(true);
      dispatch(getContactBatches({ campaignId, limit: 1000 }))
        .finally(() => setLoading(false));
    }
  }, [campaignId, dispatch]);

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fff7e6', color: '#fa8c16' },
      processing: { bg: '#e6f7ff', color: '#1890ff' },
      completed: { bg: '#f6ffed', color: '#52c41a' },
      failed: { bg: '#fff1f0', color: '#ff4d4f' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{ background: style.bg, color: style.color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Loading batches...</div>;
  if (contactBatches.length === 0) return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No batches found</div>;

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#fafafa' }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#8c8c8c' }}>Batch #</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#8c8c8c' }}>Total</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#8c8c8c' }}>RCS Capable</th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#8c8c8c' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {contactBatches.map((batch, idx) => (
            <tr key={batch._id} style={{ borderTop: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '10px 12px', fontSize: '13px' }}>{batch.batchNumber}</td>
              <td style={{ padding: '10px 12px', fontSize: '13px' }}>{batch.totalContacts}</td>
              <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                {batch.rcsCapableCount} ({((batch.rcsCapableCount / batch.totalContacts) * 100).toFixed(1)}%)
              </td>
              <td style={{ padding: '10px 12px' }}>{getStatusBadge(batch.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContactBatchList;
