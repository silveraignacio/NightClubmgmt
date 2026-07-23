// Tests import services like authService directly (not via server.ts's
// startup guard), so they need JWT_SECRET set in the test process too.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests';
