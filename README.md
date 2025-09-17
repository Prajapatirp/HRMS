# HRMS - Human Resource Management System

A comprehensive Human Resource Management System built with Next.js, MongoDB, and JWT authentication.

## Features

### Core Modules

- **Employee Management**: Complete employee profiles, organizational structure, and status tracking
- **Attendance Management**: Daily check-in/check-out, attendance calendar, overtime tracking
- **Leave Management**: Leave applications, approval workflow, leave balance tracking
- **Payroll Management**: Salary calculations, deductions, allowances, and disbursement tracking
- **Performance Management**: Goal setting, performance reviews, and appraisal system
- **Notifications**: Company announcements, alerts, and automated reminders
- **Reports & Analytics**: Comprehensive HR reports and real-time dashboards

### Key Features

- 🔐 JWT-based authentication system
- 👥 Role-based access control (Admin, HR, Manager, Employee)
- 📱 Responsive design with modern UI
- 📊 Real-time dashboard with key metrics
- 🔍 Advanced search and filtering
- 📈 Analytics and reporting
- 🔔 Notification system
- 📅 Calendar integration for attendance and leaves

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **UI Components**: Custom components with Headless UI
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DemoHrms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/demo-hrms
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system. If using a local instance:
   ```bash
   mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Default Admin Account

After setting up the database, you can create an admin account by registering through the application or by using the API directly.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Employee Management
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/[id]` - Get employee by ID
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create attendance record
- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out

### Leave Management
- `GET /api/leaves` - Get leave requests
- `POST /api/leaves` - Create leave request
- `POST /api/leaves/[id]/approve` - Approve/reject leave

### Payroll
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll` - Generate payroll

### Performance
- `GET /api/performance` - Get performance reviews
- `POST /api/performance` - Create performance review

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `POST /api/notifications/[id]/read` - Mark as read

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## User Roles

- **Admin**: Full system access
- **HR**: Employee management, payroll, performance reviews
- **Manager**: Team management, leave approvals, performance reviews
- **Employee**: Personal profile, attendance, leave applications

## Database Schema

The system uses MongoDB with the following main collections:

- **Users**: Authentication and user management
- **Employees**: Employee profiles and job information
- **Attendance**: Daily attendance records
- **Leaves**: Leave requests and approvals
- **Payroll**: Salary and payment records
- **Performance**: Performance reviews and appraisals
- **Notifications**: System notifications and announcements
- **Departments**: Organizational departments

## Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── contexts/           # React contexts
├── lib/                # Utility functions
├── middleware/         # API middleware
└── models/             # Mongoose models
```

### Adding New Features

1. Create the Mongoose model in `src/models/`
2. Add API routes in `src/app/api/`
3. Create UI components in `src/components/`
4. Add pages in `src/app/`

## Deployment

### Environment Variables for Production
```env
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-nextauth-secret
```

### Build for Production
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

## Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting features
- [ ] Integration with external HR systems
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Document management system
- [ ] Training and development module
- [ ] Recruitment management