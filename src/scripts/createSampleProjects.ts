import connectDB from '../lib/mongodb';
import Project from '../models/Project';

async function createSampleProjects() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing projects
    await Project.deleteMany({});
    console.log('Cleared existing projects');

    // Create sample projects
    const sampleProjects = [
      {
        name: 'Website Redesign',
        description: 'Complete redesign of the company website with modern UI/UX',
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        createdBy: 'admin', // This should be a valid user ID in production
      },
      {
        name: 'Mobile App Development',
        description: 'Development of a new mobile application for iOS and Android',
        status: 'active',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-12-31'),
        createdBy: 'admin',
      },
      {
        name: 'Database Migration',
        description: 'Migration from legacy database to new cloud-based solution',
        status: 'active',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-04-15'),
        createdBy: 'admin',
      },
      {
        name: 'Security Audit',
        description: 'Comprehensive security audit and vulnerability assessment',
        status: 'completed',
        startDate: new Date('2023-11-01'),
        endDate: new Date('2023-12-31'),
        createdBy: 'admin',
      },
      {
        name: 'API Integration',
        description: 'Integration with third-party APIs for payment processing',
        status: 'active',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-05-31'),
        createdBy: 'admin',
      },
      {
        name: 'Training Program',
        description: 'Employee training program for new software tools',
        status: 'inactive',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        createdBy: 'admin',
      },
    ];

    const createdProjects = await Project.insertMany(sampleProjects);
    console.log(`Created ${createdProjects.length} sample projects:`);
    
    createdProjects.forEach(project => {
      console.log(`- ${project.name} (${project.status})`);
    });

    console.log('Sample projects created successfully!');
  } catch (error) {
    console.error('Error creating sample projects:', error);
  } finally {
    process.exit(0);
  }
}

createSampleProjects();
