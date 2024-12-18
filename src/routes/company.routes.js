const express = require('express');
const authController = require('../controllers/auth.controller');
const companyController = require('../controllers/company.controller');

const router = express.Router();

router.post(
  '/add-company',
  authController.protectRoute,
  authController.restrictTo(1),
  companyController.addCompany,
);
router.patch(
  '/update-company/:companyId',
  authController.protectRoute,
  authController.restrictTo(3),
  companyController.updateCompany,
);
router.get(
  '/:companyId',
  authController.protectRoute,
  authController.restrictTo(4),
  companyController.getAllCompanies,
);

router.get(
  '/find-email/:countryId',
  authController.protectRoute,
  authController.restrictTo(4),
  companyController.getCompEmail,
);

router.get(
  '/pending/:countryId',
  authController.protectRoute,
  authController.restrictTo(3),
  companyController.getPendingCompanies,
);
router.patch(
  '/unsubscribe-company/:token',
  companyController.unsubscribeCompany,
);

router.get(
  '/view-company/:countryId',
  authController.protectRoute,
  authController.restrictTo(4),
  companyController.getCompanyById,
);

router.post(
  '/search-company/:countryId',
  authController.protectRoute,
  authController.restrictTo(4),
  companyController.searchCompany,
);

/*
router
  .route('/')
  .get(authController.protectRoute, firmController.getAllFirm)
  .post(authController.protectRoute, firmController.createFirm);

router
  .route('/pending')
  .get(authController.protectRoute, firmController.pendingFirm);

router
  .route('/generate-email')
  .post(firmController.generateEmails);
  
router
  .route('/check-rabbitMq')
  .post(firmController.sendEmailToRabbitMq);
*/

module.exports = router;
