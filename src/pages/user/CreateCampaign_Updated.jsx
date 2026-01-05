// Add this component before CreateCampaign function
const PaginatedContactList = ({ campaignId, totalContacts }) => {
  const [contacts, setContacts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    if (campaignId) {
      loadContacts();
    }
  }, [campaignId, currentPage]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await _get(`v1/campaigns/batches/${campaignId}/contacts?page=${currentPage}&limit=${pageSize}`, {}, localStorage.getItem('token'));
      if (response.data.success) {
        setContacts(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (phoneNumber) => {
    try {
      await _delete(`v1/campaigns/batches/${campaignId}/contacts/${phoneNumber}`, {}, localStorage.getItem('token'));
      message.success('Contact deleted');
      loadContacts();
    } catch (error) {
      message.error('Failed to delete contact');
    }
  };

  return (
    <Table
      dataSource={contacts}
      loading={loading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalContacts,
        onChange: (page) => setCurrentPage(page),
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} contacts`
      }}
      rowKey={(record) => record.phoneNumber}
      columns={[
        {
          title: 'SN',
          key: 'sn',
          width: 60,
          render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
        },
        {
          title: 'Phone',
          dataIndex: 'phoneNumber',
          key: 'phoneNumber',
          render: (phone) => <span style={{ fontFamily: 'monospace' }}>+91{phone}</span>
        },
        {
          title: 'Status',
          dataIndex: 'isRcsCapable',
          key: 'status',
          render: (capable) => {
            if (capable === true) return <Tag color="green">✓ RCS Ready</Tag>;
            if (capable === false) return <Tag color="red">✗ Not Capable</Tag>;
            return <Tag color="orange">Checking...</Tag>;
          }
        },
        {
          title: 'Action',
          key: 'action',
          width: 100,
          render: (_, record) => (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.phoneNumber)}
            >
              Clear
            </Button>
          )
        }
      ]}
    />
  );
};
