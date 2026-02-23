import { lazy } from 'react'

// Lazy loaded components
const LandingPage = lazy(() => import('../pages/LandingPage.jsx'))
const ScheduleDemo = lazy(() => import('../pages/ScheduleDemo.jsx'))
const Dashboard = lazy(() => import('../pages/user/Dashboard.jsx'))
const UserReports = lazy(() => import('../pages/admin/UserReports.jsx'))
const AllCampaigns = lazy(() => import('../pages/admin/AllCampaigns.jsx'))
const CreateCampaign = lazy(() => import('../pages/user/CreateCampaignNew.jsx'))
const TemplatePage = lazy(() => import('../pages/user/TemplatePage.jsx'))
const CreateTemplatePage = lazy(() => import('../pages/user/CreateTempalte.jsx'))
const Orders = lazy(() => import('../pages/user/Orders.jsx'))
const WalletTransaction = lazy(() => import('../pages/user/WalletTransaction.jsx'))
const Profile = lazy(() => import('../pages/Profile.jsx'))
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard.jsx'))
const Users = lazy(() => import('../pages/admin/Users.jsx'))
const WalletTransactions = lazy(() => import('../pages/admin/WalletTransactions.jsx'))
const AdminProfile = lazy(() => import('../pages/admin/AdminProfile.jsx'))
const AdminReports = lazy(() => import('../pages/admin/AdminReports.jsx'))
const DemoRequests = lazy(() => import('../pages/admin/DemoRequests.jsx'))
const PendingUsers = lazy(() => import('../pages/admin/PendingUsers.jsx'))
const ArchivedCampaigns = lazy(() => import('../pages/admin/ArchivedCampaigns.jsx'))
const Login = lazy(() => import('../pages/Login.jsx'))
const Register = lazy(() => import('../pages/Register.jsx'))
const Onboarding = lazy(() => import('../pages/Onboarding.jsx'))
const PendingApproval = lazy(() => import('../pages/PendingApproval.jsx'))
const Terms = lazy(() => import('../pages/user/TermsAndConditions.jsx'))

// Layouts
const Layout = lazy(() => import('../layout/layout.jsx'))
const AdminLayout = lazy(() => import('../layout/AdminLayout.jsx'))

export const pageData = {
  // Public routes
  public: [
    {
      path: '/',
      component: LandingPage,
      requiresAuth: false
    },
    {
      path: '/schedule-demo',
      component: ScheduleDemo,
      requiresAuth: false
    },
    {
      path: '/login',
      component: Login,
      requiresAuth: false
    },
    {
      path: '/register',
      component: Register,
      requiresAuth: false
    },
    {
      path: '/onboarding',
      component: Onboarding,
      requiresAuth: true,
      skipOnboardingCheck: true // Special flag to allow access without full verification
    },
    {
      path: '/pending-approval',
      component: PendingApproval,
      requiresAuth: true,
      skipOnboardingCheck: true
    },
    {
      path: '/terms',
      component: Terms
    },
  ],

  // User routes
  user: [
    {
      path: '/dashboard',
      layout: Layout,
      allowedRoles: ['USER'],
      children: [
        {
          path: '',
          component: Dashboard,
          index: true
        },
        {
          path: 'newCampaign',
          component: CreateCampaign
        },
        {
          path: 'templates',
          component: TemplatePage
        },
        {
          path: 'create-template',
          component: CreateTemplatePage
        },
        {
          path: 'reports',
          component: Orders
        },
        {
          path: 'wallet',
          component: WalletTransaction
        },
        {
          path: 'my-reports',
          component: UserReports
        },
        {
          path: 'profile',
          component: Profile
        },


      ]
    }
  ],

  // Admin routes
  admin: [
    {
      path: '/admin',
      layout: AdminLayout,
      allowedRoles: ['ADMIN'],
      children: [
        {
          path: '',
          component: AdminDashboard,
          index: true
        },
        {
          path: 'users',
          component: Users
        },
        {
          path: 'wallet-requests',
          component: WalletTransactions
        },
        {
          path: 'profile',
          component: AdminProfile
        },
        {
          path: 'reports',
          component: AdminReports
        },
        {
          path: 'all-campaigns',
          component: AdminReports
        },
        {
          path: 'user-report/:userId',
          component: UserReports
        },
        {
          path: 'demo-requests',
          component: DemoRequests
        },
        {
          path: 'pending-users',
          component: PendingUsers
        },
        {
          path: 'archived-campaigns',
          component: ArchivedCampaigns
        }
      ]
    }
  ]
}