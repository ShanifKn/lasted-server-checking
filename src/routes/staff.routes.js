const express = require('express');
const authController = require('../controllers/auth.controller');
const staffController = require('../controllers/staff.controller');
const designationController = require('../controllers/designations.controller');

const router = express.Router();

// router.get('/hash', authController.passwordHasher);

router.post('/login', authController.login);
router.post(
  '/add-staff',
  authController.protectRoute,
  authController.restrictTo(4),
  authController.addStaff,
);
router.get(
  '/view-staff/:id',
  authController.protectRoute,
  staffController.getStaffById,
);
router.patch(
  '/update-staff/:staffId',
  authController.protectRoute,
  authController.restrictTo(5),
  staffController.staffUpdate,
);
router.patch(
  '/update-staff-password',
  authController.protectRoute,
  authController.changePassword,
);
router.post('/forgot-staff-password', authController.forgotPassword);
router.patch('/reset-staff-password/:token', authController.resetPassword);
router.get(
  '/',
  authController.protectRoute,
  authController.restrictTo(4),
  staffController.getAllStaff,
);
router.get(
  '/dashboard',
  authController.protectRoute,
  staffController.dashboard,
);
router.get(
  '/designations',
  authController.protectRoute,
  authController.restrictTo(4),
  designationController.getAllDesignations,
);
router.post(
  '/add-designation',
  authController.protectRoute,
  authController.restrictTo(4),
  designationController.addDesignation,
);
router
  .route('/update-designation/:designation')
  .patch(
    authController.protectRoute,
    authController.restrictTo(5),
    designationController.updateDesignation,
  );

/*need to be delete*/
router.patch(
  '/add-country-restriction/:countryResStaffId',
  authController.protectRoute,
  authController.restrictTo(4),
  staffController.addCountryRes,
);
router.patch(
  '/update-country-restriction/:countryResStaffId',
  authController.protectRoute,
  authController.restrictTo(5),
  staffController.updateCountryRes,
);
/*need to be delete*/

router.post(
  '/search-staff',
  authController.protectRoute,
  authController.restrictTo(4),
  authController.searchStaff,
);

module.exports = router;
