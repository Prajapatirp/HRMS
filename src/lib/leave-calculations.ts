/**
 * Leave calculation utilities
 * Handles accrual, pro-rating, and balance calculations
 */

import LeaveEntitlement from '@/models/LeaveEntitlement';
import Leave from '@/models/Leave';
import Employee from '@/models/Employee';

/**
 * Calculate monthly accrual rate from annual entitlement
 * @param annualEntitlement - Days per year
 * @returns Days per month
 */
export function calculateMonthlyAccrualRate(annualEntitlement: number): number {
  return annualEntitlement / 12;
}

/**
 * Calculate pro-rated entitlement for employees joining mid-year
 * @param annualEntitlement - Days per year
 * @param joiningDate - Employee joining date
 * @param year - Year to calculate for
 * @param includeJoinMonth - Whether to include the joining month in calculation
 * @returns Pro-rated entitlement days
 */
export function calculateProRatedEntitlement(
  annualEntitlement: number,
  joiningDate: Date,
  year: number,
  includeJoinMonth: boolean = true
): number {
  const joinDate = new Date(joiningDate);
  const joinYear = joinDate.getFullYear();
  
  // If joining in a different year, return 0
  if (joinYear !== year) {
    return 0;
  }
  
  const joinMonth = joinDate.getMonth(); // 0-11
  const monthsRemaining = includeJoinMonth 
    ? 12 - joinMonth 
    : 12 - joinMonth - 1;
  
  // Pro-rated entitlement = (annual entitlement / 12) * months remaining
  const monthlyRate = annualEntitlement / 12;
  return Math.round(monthlyRate * monthsRemaining * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate accrued days based on months worked
 * @param monthlyRate - Days per month
 * @param joiningDate - Employee joining date
 * @param currentDate - Current date (defaults to now)
 * @returns Accrued days
 */
export function calculateAccruedDays(
  monthlyRate: number,
  joiningDate: Date,
  currentDate: Date = new Date()
): number {
  const join = new Date(joiningDate);
  const current = new Date(currentDate);
  
  // Calculate months between joining date and current date
  const monthsDiff = (current.getFullYear() - join.getFullYear()) * 12 + 
                     (current.getMonth() - join.getMonth());
  
  // Include current month if we're past the joining day
  const monthsWorked = current.getDate() >= join.getDate() 
    ? monthsDiff + 1 
    : monthsDiff;
  
  return Math.round(monthlyRate * Math.max(0, monthsWorked) * 100) / 100;
}

/**
 * Check if employee is on probation
 * @param joiningDate - Employee joining date
 * @param probationMonths - Probation period in months (default 3)
 * @param currentDate - Current date (defaults to now)
 * @returns True if on probation
 */
export function isOnProbation(
  joiningDate: Date,
  probationMonths: number = 3,
  currentDate: Date = new Date()
): boolean {
  const join = new Date(joiningDate);
  const current = new Date(currentDate);
  
  const monthsDiff = (current.getFullYear() - join.getFullYear()) * 12 + 
                     (current.getMonth() - join.getMonth());
  
  return monthsDiff < probationMonths;
}

/**
 * Check if dates overlap with blackout dates
 * @param startDate - Leave start date
 * @param endDate - Leave end date
 * @param blackoutDates - Array of blackout date ranges [{start, end}]
 * @returns True if overlaps with blackout dates
 */
export function checkBlackoutDates(
  startDate: Date,
  endDate: Date,
  blackoutDates: Array<{ start: Date; end: Date }>
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return blackoutDates.some(blackout => {
    const blackoutStart = new Date(blackout.start);
    const blackoutEnd = new Date(blackout.end);
    
    // Check if leave dates overlap with blackout dates
    return (start <= blackoutEnd && end >= blackoutStart);
  });
}

/**
 * Check if leave dates overlap with existing approved/pending leaves
 * @param employeeId - Employee ID
 * @param startDate - Leave start date
 * @param endDate - Leave end date
 * @param excludeLeaveId - Leave ID to exclude from check (for updates)
 * @returns Overlapping leave if found, null otherwise
 */
export async function checkOverlappingLeaves(
  employeeId: string,
  startDate: Date,
  endDate: Date,
  excludeLeaveId?: string
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const query: any = {
    employeeId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      {
        startDate: { $lte: end },
        endDate: { $gte: start },
      },
    ],
  };
  
  if (excludeLeaveId) {
    query._id = { $ne: excludeLeaveId };
  }
  
  return await Leave.findOne(query);
}

/**
 * Calculate total days between two dates (inclusive)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Total days
 */
export function calculateTotalDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set to start of day to avoid time issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return daysDiff + 1; // Inclusive of both start and end dates
}

/**
 * Get or create leave entitlement for an employee
 * @param employeeId - Employee ID
 * @param leaveType - Leave type
 * @param year - Year
 * @returns Leave entitlement document
 */
export async function getOrCreateLeaveEntitlement(
  employeeId: string,
  leaveType: string,
  year: number
) {
  let entitlement = await LeaveEntitlement.findOne({
    employeeId,
    leaveType,
    year,
  });
  
  if (!entitlement) {
    // Get employee to check joining date
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    // Default entitlements (can be configured)
    const defaultEntitlements: Record<string, number> = {
      'pto': 12,
      'lop': 0, // Unpaid leave has no entitlement
      'comp-off': 0, // Comp off is earned, not entitled
      'sick': 6,
      'vacation': 0,
      'personal': 0,
      'maternity': 90,
      'paternity': 7,
      'bereavement': 3,
      'other': 0,
    };
    
    const annualEntitlement = defaultEntitlements[leaveType] || 0;
    
    // Calculate pro-rated entitlement if joining mid-year
    let entitlementDays = annualEntitlement;
    if (employee.jobInfo.joiningDate) {
      const joinDate = new Date(employee.jobInfo.joiningDate);
      if (joinDate.getFullYear() === year) {
        entitlementDays = calculateProRatedEntitlement(
          annualEntitlement,
          joinDate,
          year
        );
      } else if (joinDate.getFullYear() > year) {
        entitlementDays = 0;
      }
    }
    
    const monthlyRate = calculateMonthlyAccrualRate(annualEntitlement);
    const accrued = calculateAccruedDays(
      monthlyRate,
      employee.jobInfo.joiningDate || new Date(),
      new Date()
    );
    
    entitlement = new LeaveEntitlement({
      employeeId,
      leaveType,
      year,
      entitlement: entitlementDays,
      accrued: Math.min(accrued, entitlementDays),
      used: 0,
      pending: 0,
      available: Math.min(accrued, entitlementDays),
      accrualRate: monthlyRate,
    });
    
    await entitlement.save();
  }
  
  return entitlement;
}

/**
 * Update leave balance after leave creation/update/deletion
 * @param employeeId - Employee ID
 * @param leaveType - Leave type
 * @param year - Year
 */
export async function updateLeaveBalance(
  employeeId: string,
  leaveType: string,
  year: number
) {
  const entitlement = await getOrCreateLeaveEntitlement(employeeId, leaveType, year);
  
  // Calculate used days (approved and processed)
  const usedLeaves = await Leave.find({
    employeeId,
    leaveType,
    year: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
    status: { $in: ['approved', 'processed'] },
  });
  
  const used = usedLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);
  
  // Calculate pending days
  const pendingLeaves = await Leave.find({
    employeeId,
    leaveType,
    year: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
    status: 'pending',
  });
  
  const pending = pendingLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);
  
  // Update entitlement
  entitlement.used = used;
  entitlement.pending = pending;
  entitlement.available = Math.max(0, entitlement.accrued - used - pending);
  
  await entitlement.save();
  
  return entitlement;
}


