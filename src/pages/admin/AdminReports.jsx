// import React, { useEffect, useState } from "react";
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Row,
//   Col,
//   Statistic as AntStatistic,
//   Select,
//   Grid,
//   Breadcrumb,
//   DatePicker,
// } from "antd";
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   ResponsiveContainer,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   Area,
//   AreaChart,
// } from "recharts";
// import {
//   ArrowUpOutlined,
//   ArrowDownOutlined,
//   LineChartOutlined,
//   BarChartOutlined,
//   CreditCardOutlined,
// } from "@ant-design/icons";
// import { THEME_CONSTANTS } from "../../theme";
// import { _get } from '../../helper/apiClient.jsx';

// const { useBreakpoint } = Grid;
// const { RangePicker } = DatePicker;

// const revenueData = [
//   { month: "Jan", revenue: 50000, users: 120 },
//   { month: "Feb", revenue: 65000, users: 145 },
//   { month: "Mar", revenue: 75000, users: 165 },
//   { month: "Apr", revenue: 55000, users: 142 },
//   { month: "May", revenue: 85000, users: 190 },
//   { month: "Jun", revenue: 95000, users: 220 },
// ];



// function AdminReports() {
//   const screens = useBreakpoint();
//   const { user, token } = useSelector(state => state.auth);
//   const [weeklyData, setweeklyData] = useState(null);
//   const [monthlyData, setmonthlyData] = useState(null);
//   const [summary, setsummary] = useState(null);
//   const [dateRange, setDateRange] = useState(null);

//   const formatCurrency = (value) => `₹${value?.toLocaleString("en-IN") || 0}`;

//   // Calculate monthly growth percentage
//   const calculateMonthlyGrowth = () => {
//     if (!summary?.monthlyGrowth) return 0;
//     const growth = ((summary.monthlyGrowth.current - summary.monthlyGrowth.previous) / summary.monthlyGrowth.previous) * 100;
//     return growth.toFixed(1);
//   };

//   async function fatchreport(userId) {
//     try {
//       let [monthlyData, weeklyData, summary] = await Promise.all([
//         _get(`v1/dashboard/admin/monthly/${userId}`, {}, {}, token),
//         _get(`v1/dashboard/admin/weekly/${userId}`, {}, {}, token),
//         _get('v1/dashboard/admin/summary', {}, {}, token),
//       ]);

//       setweeklyData(weeklyData?.data?.data)
//       console.log(weeklyData, "=================week");
//       setmonthlyData(monthlyData?.data?.data)
//       console.log(monthlyData, "-------------------------month");
//       setsummary(summary?.data?.data)
     
//     } catch (error) {
//       console.log(error);
//     }
//   }

//   useEffect(() => {
//     if (user && token) {
//       fatchreport(user._id);
//     }
//   }, [user, token, dateRange]);

//   return (
//     <>
//       <div
//         style={{
//           background: THEME_CONSTANTS.colors.background,
//           minHeight: "100vh",
//         }}
//       >
//         <div
//           style={{
//             maxWidth: THEME_CONSTANTS.layout.maxContentWidth,
//             margin: "0 auto",
//             padding: THEME_CONSTANTS.spacing.xl,
//           }}
//         >
//           {/* Enhanced Header Section */}
//           <div
//             style={{
//               marginBottom: THEME_CONSTANTS.spacing.xxxl,
//               paddingBottom: THEME_CONSTANTS.spacing.xl,
//               borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`,
//             }}
//           >
//             <Breadcrumb
//               style={{
//                 marginBottom: THEME_CONSTANTS.spacing.md,
//                 fontSize: THEME_CONSTANTS.typography.caption.size,
//               }}
//             >
//               <Breadcrumb.Item>
//                 <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>
//                   Admin
//                 </span>
//               </Breadcrumb.Item>
//               <Breadcrumb.Item>
//                 <span
//                   style={{
//                     color: THEME_CONSTANTS.colors.primary,
//                     fontWeight: THEME_CONSTANTS.typography.h6.weight,
//                   }}
//                 >
//                   Reports
//                 </span>
//               </Breadcrumb.Item>
//             </Breadcrumb>

//             <Row gutter={[16, 16]} align="middle" justify="space-between">
//               <Col xs={24} lg={18}>
//                 <Row gutter={[16, 16]} align="middle">
//                   <Col xs={24} sm={4} md={3} lg={3}>
//                     <div
//                       style={{
//                         width: "64px",
//                         height: "64px",
//                         background: THEME_CONSTANTS.colors.primaryLight,
//                         borderRadius: THEME_CONSTANTS.radius.xl,
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         boxShadow: THEME_CONSTANTS.shadow.md,
//                         margin: "0 auto",
//                       }}
//                     >
//                       <BarChartOutlined
//                         style={{
//                           color: THEME_CONSTANTS.colors.primary,
//                           fontSize: "32px",
//                         }}
//                       />
//                     </div>
//                   </Col>
//                   <Col xs={24} sm={20} md={21} lg={21}>
//                     <div style={{ textAlign: { xs: "center", sm: "left" } }}>
//                       <h1
//                         style={{
//                           fontSize: THEME_CONSTANTS.typography.h1.size,
//                           fontWeight: THEME_CONSTANTS.typography.h1.weight,
//                           color: THEME_CONSTANTS.colors.text,
//                           marginBottom: THEME_CONSTANTS.spacing.sm,
//                           lineHeight: THEME_CONSTANTS.typography.h1.lineHeight,
//                           "@media (max-width: 768px)": {
//                             fontSize: THEME_CONSTANTS.typography.h2.size,
//                           },
//                         }}
//                       >
//                         System Reports
//                       </h1>
//                       <p
//                         style={{
//                           color: THEME_CONSTANTS.colors.textSecondary,
//                           fontSize: THEME_CONSTANTS.typography.body.size,
//                           fontWeight: 500,
//                           lineHeight:
//                             THEME_CONSTANTS.typography.body.lineHeight,
//                           margin: 0,
//                         }}
//                       >
//                         Comprehensive platform analytics, performance metrics,
//                         and detailed insights.
//                       </p>
//                     </div>
//                   </Col>
//                 </Row>
//               </Col>
//               <Col xs={24} lg={6} style={{ placeItems: "end" }}>
//                 <div style={{ textAlign: { xs: "center", lg: "right" } }}>
//                   <RangePicker
//                     style={{ width: 200, marginBottom: 8 }}
//                     onChange={(dates) => setDateRange(dates)}
//                     placeholder={['Start Date', 'End Date']}
//                   />
//                   <Select
//                     style={{ width: 180 }}
//                     defaultValue="6months"
//                     size="large"
//                     options={[
//                       { label: "Last 6 months", value: "6months" },
//                       { label: "Last 3 months", value: "3months" },
//                       { label: "Last Month", value: "1month" },
//                       { label: "Last Week", value: "1week" },
//                     ]}
//                   />
//                 </div>
//               </Col>
//             </Row>
//           </div>

//           {/* Stats Cards */}
//           <Row
//             gutter={[THEME_CONSTANTS.spacing.lg, THEME_CONSTANTS.spacing.lg]}
//             style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}
//           >
//             <Col xs={24} sm={12} md={6}>
//               <Card
//                 style={{
//                   borderRadius: THEME_CONSTANTS.radius.lg,
//                   border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                   background: THEME_CONSTANTS.colors.surface,
//                   boxShadow: THEME_CONSTANTS.shadow.sm,
//                   transition: `all ${THEME_CONSTANTS.transition.normal}`,
//                   height: "100%",
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.md;
//                   e.currentTarget.style.transform = "translateY(-4px)";
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.sm;
//                   e.currentTarget.style.transform = "translateY(0)";
//                 }}
//                 bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "flex-start",
//                     justifyContent: "space-between",
//                     gap: THEME_CONSTANTS.spacing.md,
//                   }}
//                 >
//                   <div>
//                     <div
//                       style={{
//                         fontSize: THEME_CONSTANTS.typography.bodySmall.size,
//                         color: THEME_CONSTANTS.colors.textSecondary,
//                         marginBottom: THEME_CONSTANTS.spacing.sm,
//                       }}
//                     >
//                       Total Revenue
//                     </div>
//                     <div
//                       style={{
//                         fontSize: "24px",
//                         fontWeight: 600,
//                         color: THEME_CONSTANTS.colors.primary,
//                         marginBottom: THEME_CONSTANTS.spacing.xs,
//                       }}
//                     >
//                       {formatCurrency(summary?.totalAmount)}
//                     </div>
                  
//                   </div>
//                   <div
//                     style={{
//                       width: 45,
//                       height: 45,
//                       borderRadius: THEME_CONSTANTS.radius.lg,
//                       background: THEME_CONSTANTS.colors.primaryLight,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       color: THEME_CONSTANTS.colors.primary,
//                       fontSize: 20,
//                     }}
//                   >
//                     <CreditCardOutlined />
//                   </div>
//                 </div>
//               </Card>
//             </Col>

//             <Col xs={24} sm={12} md={6}>
//               <Card
//                 style={{
//                   borderRadius: THEME_CONSTANTS.radius.lg,
//                   border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                   background: THEME_CONSTANTS.colors.surface,
//                   boxShadow: THEME_CONSTANTS.shadow.sm,
//                   transition: `all ${THEME_CONSTANTS.transition.normal}`,
//                   height: "100%",
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.md;
//                   e.currentTarget.style.transform = "translateY(-4px)";
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.sm;
//                   e.currentTarget.style.transform = "translateY(0)";
//                 }}
//                 bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "flex-start",
//                     justifyContent: "space-between",
//                     gap: THEME_CONSTANTS.spacing.md,
//                   }}
//                 >
//                   <div>
//                     <div
//                       style={{
//                         fontSize: THEME_CONSTANTS.typography.bodySmall.size,
//                         color: THEME_CONSTANTS.colors.textSecondary,
//                         marginBottom: THEME_CONSTANTS.spacing.sm,
//                       }}
//                     >
//                       Messages Sent
//                     </div>
//                     <div
//                       style={{
//                         fontSize: "24px",
//                         fontWeight: 600,
//                         color: THEME_CONSTANTS.colors.warning,
//                         marginBottom: THEME_CONSTANTS.spacing.xs,
//                       }}
//                     >
//                       {summary?.totalMessageCost.toLocaleString("en-IN")}
//                     </div>
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: THEME_CONSTANTS.spacing.xs,
//                         fontSize: THEME_CONSTANTS.typography.caption.size,
//                         color: THEME_CONSTANTS.colors.success,
//                       }}
//                     >
//                       <ArrowUpOutlined style={{ fontSize: "11px" }} />
//                       <span>{summary?.messageGrowthCount} {summary?.messageGrowthDirection}</span>
//                     </div>
//                   </div>
//                   <div
//                     style={{
//                       width: 45,
//                       height: 45,
//                       borderRadius: THEME_CONSTANTS.radius.lg,
//                       background: THEME_CONSTANTS.colors.warningLight,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       color: THEME_CONSTANTS.colors.warning,
//                       fontSize: 20,
//                     }}
//                   >
//                     <LineChartOutlined />
//                   </div>
//                 </div>
//               </Card>
//             </Col>

//             <Col xs={24} sm={12} md={6}>
//               <Card
//                 style={{
//                   borderRadius: THEME_CONSTANTS.radius.lg,
//                   border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                   background: THEME_CONSTANTS.colors.surface,
//                   boxShadow: THEME_CONSTANTS.shadow.sm,
//                   transition: `all ${THEME_CONSTANTS.transition.normal}`,
//                   height: "100%",
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.md;
//                   e.currentTarget.style.transform = "translateY(-4px)";
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.sm;
//                   e.currentTarget.style.transform = "translateY(0)";
//                 }}
//                 bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "flex-start",
//                     justifyContent: "space-between",
//                     gap: THEME_CONSTANTS.spacing.md,
//                   }}
//                 >
//                   <div>
//                     <div
//                       style={{
//                         fontSize: THEME_CONSTANTS.typography.bodySmall.size,
//                         color: THEME_CONSTANTS.colors.textSecondary,
//                         marginBottom: THEME_CONSTANTS.spacing.sm,
//                       }}
//                     >
//                       Active Users
//                     </div>
//                     <div
//                       style={{
//                         fontSize: "24px",
//                         fontWeight: 600,
//                         color: THEME_CONSTANTS.colors.success,
//                         marginBottom: THEME_CONSTANTS.spacing.xs,
//                       }}
//                     >
//                       {summary?.activeUsers}
//                     </div>
//                     {/* <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: THEME_CONSTANTS.spacing.xs,
//                         fontSize: THEME_CONSTANTS.typography.caption.size,
//                         color: THEME_CONSTANTS.colors.success,
//                       }}
//                     >
//                       <ArrowUpOutlined style={{ fontSize: "11px" }} />
//                       <span>{summary?.activeUserGrowth} growth</span>
//                     </div> */}
//                   </div>
//                   <div
//                     style={{
//                       width: 45,
//                       height: 45,
//                       borderRadius: THEME_CONSTANTS.radius.lg,
//                       background: THEME_CONSTANTS.colors.successLight,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       color: THEME_CONSTANTS.colors.success,
//                       fontSize: 20,
//                     }}
//                   >
//                     <ArrowUpOutlined />
//                   </div>
//                 </div>
//               </Card>
//             </Col>

//             <Col xs={24} sm={12} md={6}>
//               <Card
//                 style={{
//                   borderRadius: THEME_CONSTANTS.radius.lg,
//                   border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                   background: THEME_CONSTANTS.colors.surface,
//                   boxShadow: THEME_CONSTANTS.shadow.sm,
//                   transition: `all ${THEME_CONSTANTS.transition.normal}`,
//                   height: "100%",
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.md;
//                   e.currentTarget.style.transform = "translateY(-4px)";
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.sm;
//                   e.currentTarget.style.transform = "translateY(0)";
//                 }}
//                 bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "flex-start",
//                     justifyContent: "space-between",
//                     gap: THEME_CONSTANTS.spacing.md,
//                   }}
//                 >
//                   <div>
//                     <div
//                       style={{
//                         fontSize: THEME_CONSTANTS.typography.bodySmall.size,
//                         color: THEME_CONSTANTS.colors.textSecondary,
//                         marginBottom: THEME_CONSTANTS.spacing.sm,
//                       }}
//                     >
//                       Success Rate
//                     </div>
//                     <div
//                       style={{
//                         fontSize: "24px",
//                         fontWeight: 600,
//                         color: THEME_CONSTANTS.colors.primary,
//                         marginBottom: THEME_CONSTANTS.spacing.xs,
//                       }}
//                     >
//                       {summary?.successRate}
//                     </div>
//                     {/* <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: THEME_CONSTANTS.spacing.xs,
//                         fontSize: THEME_CONSTANTS.typography.caption.size,
//                         color: THEME_CONSTANTS.colors.success,
//                       }}
//                     >
//                       <ArrowUpOutlined style={{ fontSize: "11px" }} />
//                       <span>Excellent</span>
//                     </div> */}
//                   </div>
//                   <div
//                     style={{
//                       width: 45,
//                       height: 45,
//                       borderRadius: THEME_CONSTANTS.radius.lg,
//                       background: THEME_CONSTANTS.colors.primaryLight,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       color: THEME_CONSTANTS.colors.primary,
//                       fontSize: 20,
//                     }}
//                   >
//                     <BarChartOutlined />
//                   </div>
//                 </div>
//               </Card>
//             </Col>
//           </Row>

//           {/* Charts Row 1 */}
//           <Row
//             gutter={[THEME_CONSTANTS.spacing.lg, THEME_CONSTANTS.spacing.lg]}
//             style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}
//           >
//             <Col xs={24} md={12}>
//               <Card
//                 style={{
//                   borderRadius: THEME_CONSTANTS.radius.lg,
//                   border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                   boxShadow: THEME_CONSTANTS.shadow.sm,
//                 }}
//                 title={
//                   <span
//                     style={{
//                       fontSize: THEME_CONSTANTS.typography.h5.size,
//                       fontWeight: THEME_CONSTANTS.typography.h5.weight,
//                     }}
//                   >
//                     Monthly Message Revenue 
//                   </span>
//                 }
//                 bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
//               >
//                 <ResponsiveContainer width="100%" height={300}>
//                   <AreaChart data={monthlyData?.messageData|| revenueData}>
//                     <defs>
//                       <linearGradient
//                         id="colorRevenue"
//                         x1="0"
//                         y1="0"
//                         x2="0"
//                         y2="1"
//                       >
//                         <stop
//                           offset="5%"
//                           stopColor={THEME_CONSTANTS.colors.primary}
//                           stopOpacity={0.3}
//                         />
//                         <stop
//                           offset="95%"
//                           stopColor={THEME_CONSTANTS.colors.primary}
//                           stopOpacity={0}
//                         />
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid
//                       strokeDasharray="3 3"
//                       stroke={THEME_CONSTANTS.colors.border}
//                     />
//                     <XAxis
//                       dataKey="month"
//                       stroke={THEME_CONSTANTS.colors.textSecondary}
//                     />
//                     <YAxis stroke={THEME_CONSTANTS.colors.textSecondary} />
//                     <Tooltip
//                       contentStyle={{
//                         background: THEME_CONSTANTS.colors.surface,
//                         border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                       }}
//                     />
//                     <Area
//                       type="monotone"
//                       dataKey="revenue"
//                       stroke={THEME_CONSTANTS.colors.primary}
//                       fillOpacity={1}
//                       fill="url(#colorRevenue)"
//                     />
//                   </AreaChart>
//                 </ResponsiveContainer>
//               </Card>
//             </Col>

//             <Col xs={24} md={12}>
//               <Card
//                 style={{
//                   borderRadius: THEME_CONSTANTS.radius.lg,
//                   border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                   boxShadow: THEME_CONSTANTS.shadow.sm,
//                 }}
//                 title={
//                   <span
//                     style={{
//                       fontSize: THEME_CONSTANTS.typography.h5.size,
//                       fontWeight: THEME_CONSTANTS.typography.h5.weight,
//                     }}
//                   >
//                     Messages Per Day
//                   </span>
//                 }
//                 bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
//               >
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={weeklyData || [{day: "Today", count: 2}]}>
//                     <CartesianGrid
//                       strokeDasharray="3 3"
//                       stroke={THEME_CONSTANTS.colors.border}
//                     />
//                     <XAxis
//                       dataKey="day"
//                       stroke={THEME_CONSTANTS.colors.textSecondary}
//                     />
//                     <YAxis stroke={THEME_CONSTANTS.colors.textSecondary} />
//                     <Tooltip
//                       contentStyle={{
//                         background: THEME_CONSTANTS.colors.surface,
//                         border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                       }}
//                     />
//                     <Bar
//                       dataKey="count"
//                       fill={THEME_CONSTANTS.colors.warning}
//                       radius={[8, 8, 0, 0]}
//                     />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </Card>
//             </Col>
//           </Row>

//           {/* Charts Row 2 */}
//           <Row
//             gutter={[THEME_CONSTANTS.spacing.lg, THEME_CONSTANTS.spacing.lg]}
//           >
//             <Col xs={24}>
//               <Card
//                 style={{
//                   borderRadius: THEME_CONSTANTS.radius.lg,
//                   border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                   boxShadow: THEME_CONSTANTS.shadow.sm,
//                 }}
//                 title={
//                   <span
//                     style={{
//                       fontSize: THEME_CONSTANTS.typography.h5.size,
//                       fontWeight: THEME_CONSTANTS.typography.h5.weight,
//                     }}
//                   >
//                     Revenue & Users Growth
//                   </span>
//                 }
//                 bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
//               >
//                 <ResponsiveContainer width="100%" height={350}>
//                   <LineChart data={monthlyData?.transactionData || revenueData}>
//                     <CartesianGrid
//                       strokeDasharray="3 3"
//                       stroke={THEME_CONSTANTS.colors.border}
//                     />
//                     <XAxis
//                       dataKey="month"
//                       stroke={THEME_CONSTANTS.colors.textSecondary}
//                     />
//                     <YAxis stroke={THEME_CONSTANTS.colors.textSecondary} />
//                     <Tooltip
//                       contentStyle={{
//                         background: THEME_CONSTANTS.colors.surface,
//                         border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                       }}
//                     />
//                     <Legend />
//                     <Line
//                       type="monotone"
//                       dataKey="revenue"
//                       name="Revenue"
//                       stroke={THEME_CONSTANTS.colors.primary}
//                       strokeWidth={2}
//                       dot={{ fill: THEME_CONSTANTS.colors.primary, r: 5 }}
//                     />
//                     <Line
//                       type="monotone"
//                       dataKey="users"
//                       name="Users"
//                       stroke={THEME_CONSTANTS.colors.success}
//                       strokeWidth={2}
//                       dot={{ fill: THEME_CONSTANTS.colors.success, r: 5 }}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </Card>
//             </Col>
//           </Row>
//         </div>
//       </div>
//     </>
//   );
// }

// export default AdminReports;
