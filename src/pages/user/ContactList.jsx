import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllContactsFromBatches } from '../../redux/slices/campaignSlice';
import { DeleteOutlined } from '@ant-design/icons';
import { Pagination } from 'antd';

const ContactList = ({ campaignId, visible }) => {
  const dispatch = useDispatch();
  const { allContacts, contactsPagination } = useSelector(state => state.campaigns);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Only fetch when visible is true
    if (campaignId && visible) {
      fetchContacts(page);
      
      // Auto-refresh every 2 seconds while visible
      const interval = setInterval(() => {
        fetchContacts(page);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [campaignId, page, visible]);

  const fetchContacts = (currentPage) => {
    if (!visible) return; // Don't fetch if not visible
    setLoading(true);
    dispatch(getAllContactsFromBatches({ campaignId, page: currentPage, limit: 50 }))
      .finally(() => setLoading(false));
  };

  if (loading && allContacts.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Loading contacts...</div>;
  }

  if (allContacts.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No contacts found</div>;
  }

  return (
    <div>
      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#fafafa', position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#8c8c8c' }}>#</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#8c8c8c' }}>Phone Number</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#8c8c8c' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#8c8c8c' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {allContacts.map((contact, idx) => (
              <tr key={`${contact.phoneNumber}-${idx}`} style={{ borderTop: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 12px', fontSize: '13px' }}>{(page - 1) * 50 + idx + 1}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px' }}>+91 {contact.phoneNumber}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                  {contact.isRcsCapable === null || contact.isRcsCapable === undefined ? (
                    <span style={{ background: '#e6f7ff', color: '#1890ff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      Checking...
                    </span>
                  ) : contact.isRcsCapable ? (
                    <span style={{ background: '#f6ffed', color: '#52c41a', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      RCS Ready
                    </span>
                  ) : (
                    <span style={{ background: '#fff1f0', color: '#ff4d4f', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                      Not Capable
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <DeleteOutlined 
                    style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '16px' }}
                    onClick={() => {
                      // TODO: Implement delete single contact
                      console.log('Delete contact:', contact.phoneNumber);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {contactsPagination.pages > 1 && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Pagination
            current={page}
            total={contactsPagination.total}
            pageSize={50}
            onChange={setPage}
            showSizeChanger={false}
            showTotal={(total) => `Total ${total} contacts`}
          />
        </div>
      )}
    </div>
  );
};

export default ContactList;
