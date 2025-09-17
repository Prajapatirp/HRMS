import connectDB from '../lib/mongodb';
import Performance from '../models/Performance';

async function createSamplePerformanceReviews() {
  try {
    await connectDB();
    
    console.log('🧪 Creating Sample Performance Reviews...\n');
    
    const johnEmployeeId = 'EMP1758094397026';
    
    // Check if performance reviews already exist
    const existingCount = await Performance.countDocuments({ employeeId: johnEmployeeId });
    if (existingCount > 0) {
      console.log(`✅ John already has ${existingCount} performance reviews!`);
      return;
    }

    // Create sample performance reviews for John
    const performanceReviews = [
      {
        employeeId: johnEmployeeId,
        reviewPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
        },
        goals: [
          {
            description: 'Complete React project implementation',
            target: 'Deliver fully functional React application',
            achieved: 'Successfully delivered with 95% test coverage',
            rating: 5,
          },
          {
            description: 'Improve code quality standards',
            target: 'Reduce code complexity by 20%',
            achieved: 'Achieved 25% reduction in cyclomatic complexity',
            rating: 4,
          },
          {
            description: 'Mentor junior developers',
            target: 'Guide 2 junior developers on best practices',
            achieved: 'Successfully mentored 3 junior developers',
            rating: 5,
          },
        ],
        competencies: [
          {
            skill: 'Technical Skills',
            rating: 5,
            comments: 'Excellent technical knowledge and problem-solving abilities',
          },
          {
            skill: 'Communication',
            rating: 4,
            comments: 'Good communication skills, could improve in technical documentation',
          },
          {
            skill: 'Teamwork',
            rating: 5,
            comments: 'Outstanding team player, always willing to help colleagues',
          },
          {
            skill: 'Leadership',
            rating: 4,
            comments: 'Shows good leadership potential, especially in mentoring',
          },
        ],
        overallRating: 4.5,
        strengths: [
          'Strong technical expertise in React and JavaScript',
          'Excellent problem-solving skills',
          'Great mentor and team player',
          'Consistent delivery of high-quality code',
        ],
        areasForImprovement: [
          'Improve technical documentation skills',
          'Enhance presentation skills for stakeholder meetings',
          'Consider taking on more complex architectural decisions',
        ],
        reviewerComments: 'John has shown exceptional growth this quarter. His technical skills are outstanding, and he has become a valuable mentor to junior developers. His code quality has improved significantly, and he consistently meets deadlines. I would like to see him take on more leadership responsibilities in the next quarter.',
        employeeComments: 'I am grateful for the feedback. I will focus on improving my documentation skills and taking on more architectural challenges. I enjoy mentoring and would like to continue developing my leadership skills.',
        status: 'approved',
        reviewedBy: 'admin@example.com',
        reviewedAt: new Date('2024-04-15'),
      },
      {
        employeeId: johnEmployeeId,
        reviewPeriod: {
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-06-30'),
        },
        goals: [
          {
            description: 'Lead new feature development',
            target: 'Successfully lead development of user authentication module',
            achieved: 'Delivered authentication module with OAuth integration',
            rating: 4,
          },
          {
            description: 'Improve system performance',
            target: 'Reduce page load time by 30%',
            achieved: 'Achieved 35% improvement in page load times',
            rating: 5,
          },
          {
            description: 'Cross-team collaboration',
            target: 'Work closely with design and QA teams',
            achieved: 'Established regular sync meetings and improved collaboration',
            rating: 4,
          },
        ],
        competencies: [
          {
            skill: 'Technical Skills',
            rating: 5,
            comments: 'Advanced technical skills, excellent at system architecture',
          },
          {
            skill: 'Communication',
            rating: 4,
            comments: 'Improved communication, better at explaining technical concepts',
          },
          {
            skill: 'Teamwork',
            rating: 5,
            comments: 'Excellent collaborator, builds strong relationships across teams',
          },
          {
            skill: 'Leadership',
            rating: 4,
            comments: 'Shows good leadership in feature development and team coordination',
          },
        ],
        overallRating: 4.3,
        strengths: [
          'Strong system architecture skills',
          'Excellent performance optimization abilities',
          'Great cross-team collaboration',
          'Consistent high-quality deliverables',
        ],
        areasForImprovement: [
          'Continue improving stakeholder communication',
          'Take on more strategic planning responsibilities',
          'Share knowledge more broadly across the team',
        ],
        reviewerComments: 'John continues to excel in his role. His leadership in the authentication module development was impressive, and his performance optimization work has had a significant impact. His collaboration with other teams has improved our overall product quality.',
        employeeComments: 'I appreciate the opportunity to lead the authentication module. I learned a lot about system architecture and enjoyed the cross-team collaboration. I will continue to focus on improving my strategic thinking and knowledge sharing.',
        status: 'reviewed',
        reviewedBy: 'admin@example.com',
        reviewedAt: new Date('2024-07-10'),
      },
      {
        employeeId: johnEmployeeId,
        reviewPeriod: {
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-09-30'),
        },
        goals: [
          {
            description: 'Implement advanced testing strategies',
            target: 'Achieve 90% test coverage across all modules',
            achieved: 'Reached 92% test coverage with comprehensive E2E tests',
            rating: 5,
          },
          {
            description: 'Knowledge sharing and documentation',
            target: 'Create technical documentation for 3 major features',
            achieved: 'Created comprehensive documentation for 4 features',
            rating: 4,
          },
          {
            description: 'Mentor new team members',
            target: 'Onboard and mentor 2 new developers',
            achieved: 'Successfully onboarded 3 new developers',
            rating: 5,
          },
        ],
        competencies: [
          {
            skill: 'Technical Skills',
            rating: 5,
            comments: 'Expert-level technical skills, excellent at testing strategies',
          },
          {
            skill: 'Communication',
            rating: 5,
            comments: 'Significantly improved documentation and knowledge sharing',
          },
          {
            skill: 'Teamwork',
            rating: 5,
            comments: 'Outstanding team player and mentor',
          },
          {
            skill: 'Leadership',
            rating: 5,
            comments: 'Excellent leadership in mentoring and knowledge sharing',
          },
        ],
        overallRating: 4.8,
        strengths: [
          'Expert-level testing and quality assurance skills',
          'Excellent documentation and knowledge sharing',
          'Outstanding mentoring abilities',
          'Strong technical leadership',
        ],
        areasForImprovement: [
          'Consider taking on more strategic product decisions',
          'Explore opportunities in technical architecture planning',
          'Continue building influence across the organization',
        ],
        reviewerComments: 'John has exceeded expectations this quarter. His testing strategies have significantly improved our code quality, and his documentation work has been invaluable for the team. His mentoring of new developers has been exceptional. He is ready for more senior responsibilities.',
        employeeComments: 'I am proud of the progress I have made in testing and documentation. I enjoy mentoring and helping new team members succeed. I am excited about taking on more strategic responsibilities and contributing to product decisions.',
        status: 'draft',
        reviewedBy: 'admin@example.com',
      },
    ];

    // Save all performance reviews
    await Performance.insertMany(performanceReviews);
    
    console.log(`✅ Created ${performanceReviews.length} performance reviews for John!`);
    console.log(`📅 Date range: ${performanceReviews[0].reviewPeriod.startDate.toDateString()} to ${performanceReviews[performanceReviews.length - 1].reviewPeriod.endDate.toDateString()}`);
    console.log('');
    console.log('📊 Summary:');
    const approvedCount = performanceReviews.filter(r => r.status === 'approved').length;
    const reviewedCount = performanceReviews.filter(r => r.status === 'reviewed').length;
    const draftCount = performanceReviews.filter(r => r.status === 'draft').length;
    console.log(`- Approved: ${approvedCount} reviews`);
    console.log(`- Reviewed: ${reviewedCount} reviews`);
    console.log(`- Draft: ${draftCount} reviews`);
    console.log('');
    console.log('🎉 John can now test the performance reviews table, filtering, and actions!');
    
  } catch (error) {
    console.error('❌ Error creating sample performance reviews:', error);
  }
}

createSamplePerformanceReviews();
