// Minimal JSON Resume (JRS) starter used as fallback/default when FRESH starter
// has been removed from external dependencies. Keep this small and valid for
// JSON Resume schema validation in the repo's tests and new command.
module.exports = {
  jrs: {
    basics: {
      name: 'Your Name',
      label: 'Your Profession',
      summary: 'A brief description of yourself as a candidate.',
      website: 'http://your-website.com',
      phone: '1-999-999-9999',
      email: 'your-email@your-website.com',
      location: {
        address: '123 Somewhere Lane',
        postalCode: '90210',
        city: 'Castle Rock',
        countryCode: 'US',
        region: 'State, province, or region'
      },
      profiles: []
    },
    work: [],
    education: [],
    skills: [],
    volunteer: [],
    awards: [],
    publications: [],
    interests: [],
    references: [],
    languages: []
  }
};
